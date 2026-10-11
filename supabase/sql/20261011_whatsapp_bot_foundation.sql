-- Base segura para recibir y procesar mensajes del bot de WhatsApp.
-- Ejecutar una sola vez desde Supabase SQL Editor o mediante la CLI de Supabase.

-- La conversación se identifica por teléfono. No borramos registros si existen
-- duplicados: la migración se detiene para que puedan revisarse explícitamente.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.conversaciones_whatsapp
    GROUP BY telefono
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Hay teléfonos repetidos en conversaciones_whatsapp. Revisa los duplicados antes de volver a ejecutar esta migración.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS conversaciones_whatsapp_telefono_uidx
  ON public.conversaciones_whatsapp (telefono);

CREATE TABLE IF NOT EXISTS public.mensajes_whatsapp_procesados (
  message_id text PRIMARY KEY,
  telefono text NOT NULL,
  estado text NOT NULL
    CHECK (estado IN ('procesando', 'pendiente_envio', 'procesado', 'error')),
  respuesta text,
  error text,
  recibido_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  procesado_en timestamptz
);

CREATE INDEX IF NOT EXISTS mensajes_whatsapp_procesados_actualizado_idx
  ON public.mensajes_whatsapp_procesados (actualizado_en);

-- Estas tablas no deben ser accesibles desde el cliente del navegador.
-- El servidor usa SUPABASE_SERVICE_ROLE_KEY y nunca la expone al cliente.
ALTER TABLE public.conversaciones_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_whatsapp_procesados ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.conversaciones_whatsapp FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.mensajes_whatsapp_procesados FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.conversaciones_whatsapp TO service_role;
GRANT ALL ON TABLE public.mensajes_whatsapp_procesados TO service_role;

-- Guarda el estado conversacional y la respuesta saliente en una sola transacción.
-- De este modo, un reintento del webhook no vuelve a agregar el mismo producto al carrito.
CREATE OR REPLACE FUNCTION public.guardar_respuesta_whatsapp(
  p_message_id text,
  p_telefono text,
  p_estado text,
  p_pedido_borrador jsonb,
  p_respuesta text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Operación reservada al servidor del bot';
  END IF;

  IF NULLIF(BTRIM(p_message_id), '') IS NULL
     OR NULLIF(BTRIM(p_telefono), '') IS NULL
     OR p_pedido_borrador IS NULL
     OR jsonb_typeof(p_pedido_borrador) <> 'object'
     OR p_respuesta IS NULL THEN
    RAISE EXCEPTION 'Datos incompletos para guardar la conversación';
  END IF;

  PERFORM 1
  FROM public.mensajes_whatsapp_procesados
  WHERE message_id = p_message_id
    AND estado = 'procesando'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El mensaje no está reservado para procesamiento';
  END IF;

  INSERT INTO public.conversaciones_whatsapp (
    id,
    telefono,
    estado,
    pedido_borrador,
    actualizado_en
  )
  VALUES (
    gen_random_uuid(),
    p_telefono,
    p_estado,
    p_pedido_borrador,
    now()
  )
  ON CONFLICT (telefono)
  DO UPDATE SET
    estado = EXCLUDED.estado,
    pedido_borrador = EXCLUDED.pedido_borrador,
    actualizado_en = now();

  UPDATE public.mensajes_whatsapp_procesados
  SET
    estado = 'pendiente_envio',
    respuesta = p_respuesta,
    error = NULL,
    actualizado_en = now()
  WHERE message_id = p_message_id
    AND estado = 'procesando';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo guardar el estado del mensaje';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.guardar_respuesta_whatsapp(text, text, text, jsonb, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_respuesta_whatsapp(text, text, text, jsonb, text)
  TO service_role;

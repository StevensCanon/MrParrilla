-- Registra un pago manual por transferencia y cierra la comanda.
-- No realiza ninguna validación bancaria: el cajero confirma manualmente
-- que la transferencia fue recibida.

CREATE OR REPLACE FUNCTION public.confirmar_pago_transferencia(
  p_comanda_id uuid
)
RETURNS TABLE (
  pago_id uuid,
  comanda_id uuid,
  mesa_id uuid,
  total numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_rol rol_usuario;
  v_comanda comandas%ROWTYPE;
  v_total numeric;
  v_pago_id uuid;
BEGIN
  v_rol := public.rol_actual();

  IF v_rol IS NULL THEN
    RAISE EXCEPTION 'No se pudo identificar el usuario autenticado';
  END IF;

  IF v_rol NOT IN ('admin'::rol_usuario, 'cajero'::rol_usuario) THEN
    RAISE EXCEPTION 'El usuario no tiene permisos para registrar pagos';
  END IF;

  SELECT *
  INTO v_comanda
  FROM public.comandas
  WHERE id = p_comanda_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La comanda no existe';
  END IF;

  IF v_comanda.estado <> 'abierta'::estado_comanda THEN
    RAISE EXCEPTION 'La comanda ya está cerrada';
  END IF;

  IF v_comanda.canal = 'restaurante'::canal_pedido
     AND v_comanda.mesa_id IS NULL THEN
    RAISE EXCEPTION 'La comanda presencial no tiene una mesa asociada';
  END IF;

  SELECT COALESCE(
    SUM(ci.cantidad * ci.precio_unitario),
    0
  )
  INTO v_total
  FROM public.comanda_items ci
  WHERE ci.comanda_id = p_comanda_id
    AND ci.item_padre_id IS NULL;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'La comanda no tiene un valor válido para cobrar';
  END IF;

  INSERT INTO public.pagos (
    comanda_id,
    mesa_id,
    cajero_id,
    metodo_pago,
    monto,
    monto_recibido,
    cambio,
    estado
  )
  VALUES (
    v_comanda.id,
    v_comanda.mesa_id,
    auth.uid(),
    'transferencia'::metodo_pago,
    v_total,
    v_total,
    0,
    'confirmado'
  )
  RETURNING id INTO v_pago_id;

  UPDATE public.comandas
  SET
    estado = 'cerrada'::estado_comanda,
    metodo_pago = 'transferencia'::metodo_pago,
    cajero_id = auth.uid(),
    cerrada_en = now()
  WHERE id = v_comanda.id;

  INSERT INTO public.transacciones (
    tipo,
    monto,
    categoria,
    descripcion,
    fecha,
    comanda_id,
    automatica,
    creado_por
  )
  VALUES (
    'ingreso'::finanza,
    v_total,
    'venta',
    'Pago por transferencia de comanda',
    CURRENT_DATE,
    v_comanda.id,
    true,
    auth.uid()
  );

  RETURN QUERY
  SELECT
    v_pago_id,
    v_comanda.id,
    v_comanda.mesa_id,
    v_total;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.confirmar_pago_transferencia(uuid)
TO authenticated;

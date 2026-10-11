import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

import {
  procesarMensajeBot,
  type BorradorPedidoBot,
  type ContextoBot,
  type EstadoConversacionWhatsApp,
  type ItemCatalogoBot,
  type ResultadoBot,
} from "@/lib/whatsapp/bot-engine";
import { enviarTextoWhatsApp } from "@/lib/whatsapp/cloud-api";
import { crearClienteSupabaseServidor } from "@/lib/whatsapp/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MensajeEntranteMeta = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
};

type ValorCambioMeta = {
  metadata?: { phone_number_id?: string };
  messages?: MensajeEntranteMeta[];
};

type PayloadWebhookMeta = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: ValorCambioMeta;
    }>;
  }>;
};

type EstadoMensajeProcesado =
  | "procesando"
  | "pendiente_envio"
  | "procesado"
  | "error";

type RegistroMensajeProcesado = {
  message_id: string;
  telefono: string;
  estado: EstadoMensajeProcesado;
  respuesta: string | null;
  actualizado_en: string;
};

type RegistroConversacion = {
  estado: string;
  pedido_borrador: unknown;
};

const ESTADOS_VALIDOS: EstadoConversacionWhatsApp[] = [
  "inicio",
  "viendo_menu",
  "armando_pedido",
  "confirmando_pedido",
  "pedido_confirmado",
  "cancelado",
];

function respuestaJson(mensaje: string, estado: number) {
  return Response.json({ error: mensaje }, { status: estado });
}

function verificarFirmaMeta(cuerpo: string, firma: string | null): boolean {
  const secreto = process.env.WHATSAPP_APP_SECRET;

  if (!secreto || !firma || !firma.startsWith("sha256=")) {
    return false;
  }

  const firmaHex = firma.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(firmaHex)) {
    return false;
  }

  const esperada = createHmac("sha256", secreto)
    .update(cuerpo, "utf8")
    .digest();
  const recibida = Buffer.from(firmaHex, "hex");

  return (
    recibida.length === esperada.length &&
    timingSafeEqual(recibida, esperada)
  );
}

function fechaColombia(): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;
  const dia = partes.find((parte) => parte.type === "day")?.value;

  if (!anio || !mes || !dia) {
    throw new Error("No se pudo determinar la fecha de Colombia.");
  }

  return `${anio}-${mes}-${dia}`;
}

function esObjeto(
  valor: unknown,
): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function normalizarBorrador(valor: unknown): BorradorPedidoBot {
  if (!esObjeto(valor) || !Array.isArray(valor.items)) {
    return { items: [] };
  }

  const items = valor.items.flatMap((item): BorradorPedidoBot["items"] => {
    if (!esObjeto(item)) return [];

    const platoId = item.platoId;
    const nombre = item.nombre;
    const precioUnitario = Number(item.precioUnitario);
    const cantidad = Number(item.cantidad);

    if (
      typeof platoId !== "string" ||
      typeof nombre !== "string" ||
      !Number.isFinite(precioUnitario) ||
      precioUnitario < 0 ||
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > 99
    ) {
      return [];
    }

    return [{
      platoId,
      nombre,
      precioUnitario,
      cantidad,
    }];
  });

  return {
    items,
    ...(typeof valor.nombreCliente === "string"
      ? { nombreCliente: valor.nombreCliente }
      : {}),
    ...(typeof valor.direccionEntrega === "string"
      ? { direccionEntrega: valor.direccionEntrega }
      : {}),
  };
}

function normalizarEstado(valor: string): EstadoConversacionWhatsApp {
  return ESTADOS_VALIDOS.includes(valor as EstadoConversacionWhatsApp)
    ? (valor as EstadoConversacionWhatsApp)
    : "inicio";
}

async function cargarCatalogoDelDia(): Promise<ItemCatalogoBot[]> {
  const supabase = crearClienteSupabaseServidor();

  const { data: menuData, error: menuError } = await supabase
    .from("menus")
    .select("id")
    .eq("fecha", fechaColombia())
    .eq("estado", "activo")
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (menuError) {
    throw new Error("No se pudo consultar el menú activo.");
  }

  if (!menuData) return [];

  const { data: menuPlatosData, error: menuPlatosError } = await supabase
    .from("menu_platos")
    .select("plato_id, activo")
    .eq("menu_id", menuData.id)
    .eq("activo", true);

  if (menuPlatosError) {
    throw new Error("No se pudieron consultar los platos del menú.");
  }

  const platoIds = [
    ...new Set(
      (menuPlatosData ?? []).map((item) => item.plato_id as string),
    ),
  ];

  if (platoIds.length === 0) return [];

  const { data: platosData, error: platosError } = await supabase
    .from("platos")
    .select("id, nombre, precio, disponible")
    .in("id", platoIds)
    .eq("disponible", true)
    .order("nombre", { ascending: true });

  if (platosError) {
    throw new Error("No se pudo consultar el catálogo de platos.");
  }

  return (platosData ?? []).map((plato) => ({
    id: plato.id as string,
    nombre: plato.nombre as string,
    precio: Number(plato.precio),
    disponible: Boolean(plato.disponible),
  }));
}

async function reclamarMensaje(
  supabase: ReturnType<typeof crearClienteSupabaseServidor>,
  messageId: string,
  telefono: string,
): Promise<
  | { tipo: "nuevo" }
  | { tipo: "pendiente"; respuesta: string }
  | { tipo: "omitido" }
> {
  const { error: insertarError } = await supabase
    .from("mensajes_whatsapp_procesados")
    .insert({
      message_id: messageId,
      telefono,
      estado: "procesando",
    });

  if (!insertarError) return { tipo: "nuevo" };

  if (insertarError.code !== "23505") {
    throw new Error("No se pudo registrar el mensaje entrante.");
  }

  const { data, error } = await supabase
    .from("mensajes_whatsapp_procesados")
    .select("message_id, telefono, estado, respuesta, actualizado_en")
    .eq("message_id", messageId)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo verificar si el mensaje ya fue procesado.");
  }

  const registro = data as RegistroMensajeProcesado | null;
  if (!registro) return { tipo: "omitido" };

  if (registro.estado === "procesado") {
    return { tipo: "omitido" };
  }

  if (registro.estado === "pendiente_envio" && registro.respuesta) {
    return { tipo: "pendiente", respuesta: registro.respuesta };
  }

  const limiteAntiguo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const puedeReintentar =
    registro.estado === "error" ||
    (registro.estado === "procesando" &&
      registro.actualizado_en < limiteAntiguo);

  if (!puedeReintentar) return { tipo: "omitido" };

  const { data: reclamado, error: reclamarError } = await supabase
    .from("mensajes_whatsapp_procesados")
    .update({
      estado: "procesando",
      error: null,
      respuesta: null,
      actualizado_en: new Date().toISOString(),
    })
    .eq("message_id", messageId)
    .eq("estado", registro.estado)
    .lt(
      "actualizado_en",
      registro.estado === "error"
        ? new Date(Date.now() + 1000).toISOString()
        : limiteAntiguo,
    )
    .select("message_id")
    .maybeSingle();

  if (reclamarError) {
    throw new Error("No se pudo reintentar el procesamiento del mensaje.");
  }

  return reclamado ? { tipo: "nuevo" } : { tipo: "omitido" };
}

async function marcarMensajeProcesado(
  supabase: ReturnType<typeof crearClienteSupabaseServidor>,
  messageId: string,
): Promise<void> {
  const ahora = new Date().toISOString();
  const { error } = await supabase
    .from("mensajes_whatsapp_procesados")
    .update({
      estado: "procesado",
      error: null,
      actualizado_en: ahora,
      procesado_en: ahora,
    })
    .eq("message_id", messageId)
    .eq("estado", "pendiente_envio");

  if (error) {
    throw new Error("No se pudo marcar el mensaje como procesado.");
  }
}

async function procesarMensajeEntrante(
  supabase: ReturnType<typeof crearClienteSupabaseServidor>,
  mensaje: MensajeEntranteMeta,
): Promise<void> {
  if (!mensaje.id || !mensaje.from) return;

  const reclamo = await reclamarMensaje(
    supabase,
    mensaje.id,
    mensaje.from,
  );

  if (reclamo.tipo === "omitido") return;

  if (reclamo.tipo === "pendiente") {
    await enviarTextoWhatsApp(mensaje.from, reclamo.respuesta);
    await marcarMensajeProcesado(supabase, mensaje.id);
    return;
  }

  let respuestaGuardada = false;

  try {
    const { data: conversacionData, error: conversacionError } = await supabase
      .from("conversaciones_whatsapp")
      .select("estado, pedido_borrador")
      .eq("telefono", mensaje.from)
      .maybeSingle();

    if (conversacionError) {
      throw new Error("No se pudo recuperar la conversación.");
    }

    const conversacion =
      conversacionData as RegistroConversacion | null;
    const estado = normalizarEstado(conversacion?.estado ?? "inicio");
    const borrador = normalizarBorrador(conversacion?.pedido_borrador);

    let resultado: Pick<ResultadoBot, "respuesta" | "estado" | "borrador">;

    if (mensaje.type !== "text") {
      resultado = {
        respuesta:
          "Por ahora puedo leer mensajes de texto. Escribe *MENÚ* para consultar los productos disponibles.",
        estado,
        borrador,
      };
    } else {
      const texto = mensaje.text?.body ?? "";

      if (texto.length > 4000) {
        resultado = {
          respuesta:
            "Tu mensaje es demasiado largo. Envíame una instrucción corta, como *MENÚ* o *CARRITO*.",
          estado,
          borrador,
        };
      } else {
        const catalogo = await cargarCatalogoDelDia();
        const contexto: ContextoBot = {
          estado,
          borrador,
          catalogo,
        };
        resultado = procesarMensajeBot(texto, contexto);
      }
    }

    const { error: guardarError } = await supabase.rpc(
      "guardar_respuesta_whatsapp",
      {
        p_message_id: mensaje.id,
        p_telefono: mensaje.from,
        p_estado: resultado.estado,
        p_pedido_borrador: resultado.borrador,
        p_respuesta: resultado.respuesta,
      },
    );

    if (guardarError) {
      throw new Error("No se pudo guardar la conversación del bot.");
    }

    respuestaGuardada = true;

    await enviarTextoWhatsApp(mensaje.from, resultado.respuesta);
    await marcarMensajeProcesado(supabase, mensaje.id);
  } catch (error) {
    // Si ya se guardó la respuesta, queda pendiente de envío para que un reintento
    // no vuelva a ejecutar el motor ni agregue dos veces el producto al carrito.
    if (!respuestaGuardada) {
      await supabase
        .from("mensajes_whatsapp_procesados")
        .update({
          estado: "error",
          error:
            error instanceof Error
              ? error.message.slice(0, 300)
              : "Error inesperado",
          actualizado_en: new Date().toISOString(),
        })
        .eq("message_id", mensaje.id)
        .eq("estado", "procesando");
    }

    throw error;
  }
}

export async function GET(request: NextRequest) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) {
    return respuestaJson("Falta configurar el token de verificación.", 500);
  }

  const url = new URL(request.url);
  const modo = url.searchParams.get("hub.mode");
  const tokenRecibido = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    modo !== "subscribe" ||
    tokenRecibido !== verifyToken ||
    !challenge
  ) {
    return new Response("Verificación de webhook no válida.", {
      status: 403,
    });
  }

  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    return respuestaJson("Falta configurar el secreto de la aplicación.", 500);
  }

  const cuerpo = await request.text();

  if (cuerpo.length > 1_000_000) {
    return respuestaJson("El cuerpo del webhook supera el tamaño permitido.", 413);
  }

  if (!verificarFirmaMeta(cuerpo, request.headers.get("x-hub-signature-256"))) {
    return respuestaJson("Firma del webhook no válida.", 401);
  }

  let payload: PayloadWebhookMeta;
  try {
    payload = JSON.parse(cuerpo) as PayloadWebhookMeta;
  } catch {
    return respuestaJson("JSON no válido.", 400);
  }

  if (payload.object !== "whatsapp_business_account") {
    return Response.json({ recibido: true });
  }

  const phoneNumberIdConfigurado = process.env.WHATSAPP_PHONE_NUMBER_ID;

  try {
    const supabase = crearClienteSupabaseServidor();
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const valor = change.value;
        const phoneNumberIdRecibido = valor?.metadata?.phone_number_id;

        if (
          phoneNumberIdConfigurado &&
          phoneNumberIdRecibido &&
          phoneNumberIdRecibido !== phoneNumberIdConfigurado
        ) {
          continue;
        }

        for (const mensaje of valor?.messages ?? []) {
          await procesarMensajeEntrante(supabase, mensaje);
        }
      }
    }
  } catch {
    // Devuelve un error para que Meta pueda reintentar. No exponemos datos
    // personales ni detalles internos de Supabase al remitente del webhook.
    return respuestaJson("No se pudo procesar el mensaje.", 500);
  }

  return Response.json({ recibido: true });
}

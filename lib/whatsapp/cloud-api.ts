type RespuestaWhatsAppApi = {
  messages?: Array<{ id?: string }>;
};

function obtenerConfiguracion() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION;

  if (!accessToken || !phoneNumberId || !graphApiVersion) {
    throw new Error(
      "Falta configurar WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_GRAPH_API_VERSION.",
    );
  }

  if (!/^v\\d+\\.\\d+$/.test(graphApiVersion)) {
    throw new Error(
      "WHATSAPP_GRAPH_API_VERSION debe tener un formato como vXX.0.",
    );
  }

  return { accessToken, phoneNumberId, graphApiVersion };
}

/**
 * Envía texto usando la API oficial de WhatsApp Cloud API.
 * El token solo se usa en el servidor y nunca se devuelve al cliente.
 */
export async function enviarTextoWhatsApp(
  telefono: string,
  mensaje: string,
): Promise<void> {
  const { accessToken, phoneNumberId, graphApiVersion } =
    obtenerConfiguracion();

  const respuesta = await fetch(
    `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: telefono,
        type: "text",
        text: {
          preview_url: false,
          body: mensaje,
        },
      }),
      cache: "no-store",
    },
  );

  if (!respuesta.ok) {
    // No registrar el cuerpo de la solicitud ni el token en los errores.
    throw new Error(
      `WhatsApp Cloud API devolvió HTTP ${respuesta.status} al enviar el mensaje.`,
    );
  }

  const resultado =
    (await respuesta.json()) as RespuestaWhatsAppApi;

  if (!resultado.messages?.[0]?.id) {
    throw new Error(
      "WhatsApp Cloud API no devolvió un identificador para el mensaje saliente.",
    );
  }
}

export type EstadoConversacionWhatsApp =
  | "inicio"
  | "viendo_menu"
  | "armando_pedido"
  | "confirmando_pedido"
  | "pedido_confirmado"
  | "cancelado";

export type ItemCatalogoBot = {
  id: string;
  nombre: string;
  precio: number;
  disponible: boolean;
  descripcion?: string;
};

export type ItemBorradorBot = {
  platoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
};

export type BorradorPedidoBot = {
  items: ItemBorradorBot[];
  nombreCliente?: string;
  direccionEntrega?: string;
};

export type ContextoBot = {
  estado: EstadoConversacionWhatsApp;
  borrador: BorradorPedidoBot;
  catalogo: ItemCatalogoBot[];
};

export type ResultadoBot = {
  respuesta: string;
  estado: EstadoConversacionWhatsApp;
  borrador: BorradorPedidoBot;
  accion:
    | "ninguna"
    | "consultar_menu"
    | "solicitar_datos_entrega"
    | "solicitar_confirmacion";
};

const ESTADO_INICIAL: EstadoConversacionWhatsApp = "inicio";

function normalizarMensaje(mensaje: string): string {
  return mensaje
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-CO");
}

function formatearPrecio(valor: number): string {
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function respuestaMenu(catalogo: ItemCatalogoBot[]): string {
  const disponibles = catalogo.filter(
    (item) => item.disponible && Number.isFinite(item.precio) && item.precio >= 0,
  );

  if (disponibles.length === 0) {
    return "En este momento no encuentro productos disponibles. Intenta nuevamente más tarde o comunícate directamente con el restaurante.";
  }

  const lineas = disponibles.map(
    (item, indice) =>
      `${indice + 1}. ${item.nombre} — ${formatearPrecio(item.precio)}`,
  );

  return [
    "🍽️ *Menú disponible*",
    "",
    ...lineas,
    "",
    "Para agregar un producto, escribe su número. Ejemplo: 2",
    "Escribe *CARRITO* para ver tu pedido o *CANCELAR* para empezar de nuevo.",
  ].join("\n");
}

function totalPedido(items: ItemBorradorBot[]): number {
  return items.reduce(
    (total, item) => total + item.precioUnitario * item.cantidad,
    0,
  );
}

/**
 * Motor conversacional puro: no accede a Supabase ni envía mensajes.
 * Los precios y la disponibilidad deben venir de una consulta confiable del servidor.
 */
export function procesarMensajeBot(
  mensaje: string,
  contexto: ContextoBot,
): ResultadoBot {
  const texto = normalizarMensaje(mensaje);
  const estado = contexto.estado || ESTADO_INICIAL;
  const borrador = contexto.borrador ?? { items: [] };

  if (!texto) {
    return {
      respuesta: "No alcancé a leer tu mensaje. Escribe *MENÚ* para ver las opciones.",
      estado,
      borrador,
      accion: "ninguna",
    };
  }

  if (["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "inicio"].includes(texto)) {
    return {
      respuesta: [
        "¡Hola! 👋 Bienvenido a *MrParrilla*.",
        "",
        "Puedo ayudarte a consultar el menú y preparar tu pedido.",
        "Escribe *MENÚ* para ver los productos disponibles.",
      ].join("\n"),
      estado: "inicio",
      borrador: { items: [] },
      accion: "ninguna",
    };
  }

  if (["ayuda", "opciones"].includes(texto)) {
    return {
      respuesta: "Puedes escribir *MENÚ* para ver los productos, *CARRITO* para revisar tu pedido o *CANCELAR* para vaciarlo.",
      estado,
      borrador,
      accion: "ninguna",
    };
  }

  if (["cancelar", "cancelar pedido", "reiniciar"].includes(texto)) {
    return {
      respuesta: "Listo, he vaciado el borrador de tu pedido. Cuando quieras comenzar, escribe *MENÚ*.",
      estado: "cancelado",
      borrador: { items: [] },
      accion: "ninguna",
    };
  }

  if (["menu", "menú", "carta", "productos"].includes(texto)) {
    return {
      respuesta: respuestaMenu(contexto.catalogo),
      estado: "viendo_menu",
      borrador,
      accion: "consultar_menu",
    };
  }

  if (["carrito", "mi pedido", "ver pedido"].includes(texto)) {
    if (borrador.items.length === 0) {
      return {
        respuesta: "Tu pedido está vacío. Escribe *MENÚ* para consultar los productos.",
        estado: "viendo_menu",
        borrador,
        accion: "ninguna",
      };
    }

    const lineas = borrador.items.map(
      (item) =>
        `• ${item.cantidad} × ${item.nombre} — ${formatearPrecio(item.precioUnitario * item.cantidad)}`,
    );

    return {
      respuesta: [
        "🛒 *Tu pedido hasta ahora*",
        "",
        ...lineas,
        "",
        `*Total provisional: ${formatearPrecio(totalPedido(borrador.items))}*`,
        "",
        "Escribe *MENÚ* para seguir agregando o *CONFIRMAR* para continuar.",
      ].join("\n"),
      estado: "armando_pedido",
      borrador,
      accion: "ninguna",
    };
  }

  if (["confirmar", "confirmar pedido", "listo"].includes(texto)) {
    if (borrador.items.length === 0) {
      return {
        respuesta: "Todavía no tienes productos en el pedido. Escribe *MENÚ* para comenzar.",
        estado: "viendo_menu",
        borrador,
        accion: "ninguna",
      };
    }

    return {
      respuesta: "Antes de confirmar el pedido, necesito los datos de entrega. Esta versión de prueba todavía no registra comandas ni cobra pedidos.",
      estado: "confirmando_pedido",
      borrador,
      accion: "solicitar_datos_entrega",
    };
  }

  const indiceSeleccionado = Number(texto);
  if (Number.isInteger(indiceSeleccionado) && indiceSeleccionado > 0) {
    const disponibles = contexto.catalogo.filter(
      (item) => item.disponible && Number.isFinite(item.precio) && item.precio >= 0,
    );
    const seleccionado = disponibles[indiceSeleccionado - 1];

    if (!seleccionado) {
      return {
        respuesta: "Ese número no corresponde a un producto disponible. Escribe *MENÚ* para ver la lista actualizada.",
        estado: "viendo_menu",
        borrador,
        accion: "consultar_menu",
      };
    }

    const existente = borrador.items.find(
      (item) => item.platoId === seleccionado.id,
    );
    const items = existente
      ? borrador.items.map((item) =>
          item.platoId === seleccionado.id
            ? { ...item, cantidad: item.cantidad + 1, precioUnitario: seleccionado.precio, nombre: seleccionado.nombre }
            : item,
        )
      : [
          ...borrador.items,
          {
            platoId: seleccionado.id,
            nombre: seleccionado.nombre,
            precioUnitario: seleccionado.precio,
            cantidad: 1,
          },
        ];

    return {
      respuesta: `Agregué *${seleccionado.nombre}* a tu pedido.\n\nEscribe *CARRITO* para ver el resumen o *MENÚ* para seguir eligiendo.`,
      estado: "armando_pedido",
      borrador: { ...borrador, items },
      accion: "ninguna",
    };
  }

  return {
    respuesta: "No entendí esa opción. Escribe *MENÚ* para ver los productos, *CARRITO* para revisar tu pedido o *AYUDA* para ver los comandos.",
    estado,
    borrador,
    accion: "ninguna",
  };
}

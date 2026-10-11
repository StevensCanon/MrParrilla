import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import {
  procesarMensajeBot,
  type ContextoBot,
  type ItemCatalogoBot,
} from "../lib/whatsapp/bot-engine";

const catalogo: ItemCatalogoBot[] = [
  {
    id: "prueba-plato-1",
    nombre: "Bandeja de prueba",
    precio: 18000,
    disponible: true,
    descripcion: "Producto ficticio para probar el bot",
  },
  {
    id: "prueba-plato-2",
    nombre: "Hamburguesa de prueba",
    precio: 15000,
    disponible: true,
    descripcion: "Producto ficticio para probar el bot",
  },
  {
    id: "prueba-plato-3",
    nombre: "Limonada de prueba",
    precio: 5000,
    disponible: true,
    descripcion: "Producto ficticio para probar el bot",
  },
];

const readline = createInterface({ input: stdin, output: stdout });

let contexto: ContextoBot = {
  estado: "inicio",
  borrador: { items: [] },
  catalogo,
};

console.log("\nMrParrilla · Simulador local del bot de WhatsApp");
console.log("Este simulador usa productos ficticios y NO crea pedidos ni accede a Supabase.");
console.log("Prueba: hola, menú, 1, 3, carrito, confirmar, cancelar.");
console.log("Escribe /salir para terminar.\n");

try {
  while (true) {
    const mensaje = (await readline.question("Cliente > ")).trim();

    if (mensaje.toLowerCase() === "/salir") {
      break;
    }

    const resultado = procesarMensajeBot(mensaje, contexto);
    contexto = {
      estado: resultado.estado,
      borrador: resultado.borrador,
      catalogo,
    };

    console.log("\nMrParrilla >");
    console.log(resultado.respuesta);
    console.log("");
    console.log(
      `[estado: ${resultado.estado} | productos en carrito: ${resultado.borrador.items.reduce((total, item) => total + item.cantidad, 0)}]`,
    );
    console.log("");
  }
} finally {
  readline.close();
}

console.log("Simulación finalizada. No se creó ninguna comanda.");

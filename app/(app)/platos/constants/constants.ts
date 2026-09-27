import type { FormularioPlato } from "../types/types";

export const CATEGORIAS = [
  "desayuno",
  "almuerzo",
  "bebida",
  "adicional",
  "combos",
] as const;

export const FORMULARIO_INICIAL: FormularioPlato = {
  nombre: "",
  categoria: "",
  precio: "",
  disponible: true,
};

export const PLATOS_POR_PAGINA = 15;
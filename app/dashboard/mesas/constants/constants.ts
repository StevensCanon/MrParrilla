import type { RolUsuario } from "../types/types";

export const ROLES: Record<string, RolUsuario> = {
  ADMIN: "admin",
  MESERO: "mesero",
  CAJERO: "cajero",
  COCINERO: "cocinero",
};

export const CATEGORIAS = [
  {
    value: "desayuno",
    label: "Desayunos",
  },
  {
    value: "almuerzo",
    label: "Almuerzos",
  },
  {
    value: "bebida",
    label: "Bebidas",
  },
  {
    value: "adicional",
    label: "Adicionales",
  },
] as const;

export const ESTADO_COMANDA = {
  ABIERTA: "abierta",
  CERRADA: "cerrada",
} as const;

export const ESTADO_ITEM = {
  PENDIENTE: "pendiente",
  PREPARANDO: "preparando",
  LISTO: "listo",
} as const;

export const CANAL_COMANDA = "restaurante" as const;

export const TIMEZONE_COLOMBIA = "America/Bogota";
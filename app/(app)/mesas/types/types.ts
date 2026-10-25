export type RolUsuario =
  | "admin"
  | "mesero"
  | "cajero"
  | "cocinero";

export type Mesa = {
  id: string;
  nombre: string;
  activa: boolean;
  unida_a: string | null;
};

export type Plato = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  disponible: boolean;
};

export type Comanda = {
  id: string;
  mesa_id: string | null;
  mesero_id: string | null;
  estado: string;
  division_partes: number | null;
  division_partes_pagadas: number;
};

export type PagoMesa = {
  id: string;
  comanda_id: string;
  monto: number;
  estado: string;
};

export type CuentaPersona = {
  id: string;
  comanda_id: string;
  numero: number;
  monto_total: number;
  pagada: boolean;
  items: CuentaPersonaItem[];
};

export type CuentaPersonaItem = {
  id: string;
  persona_id: string;
  comanda_item_id: string;
  cantidad: number;
};

export type AsignacionPlatoPersona = {
  comanda_item_id: string;
  persona_numero: number;
  cantidad: number;
};

export type ComandaItem = {
  id: string;
  comanda_id: string;
  plato_id: string;
  item_padre_id: string | null;
  opcion_id: string | null;
  cantidad: number;
  precio_unitario: number;
  estado: string;
  observaciones: string | null;
  menu_opcion_id: string | null;
};

export type OpcionMenu = {
  menu_opcion_id: string;
  opcion_id: string;
  nombre: string;
  recargo: number;
  agotado: boolean;
  orden: number;
};

export type GrupoMenu = {
  id: string;
  grupo_id: string;
  nombre: string;
  obligatorio: boolean;
  orden: number;
  opciones: OpcionMenu[];
};

export type ConfiguracionPlato = {
  menu_plato_id: string;
  plato_id: string;
  grupos: GrupoMenu[];
};

export type OpcionSeleccionada = {
  menu_opcion_id: string;
  opcion_id: string;
  nombre: string;
  grupo_id: string;
  grupo_nombre: string;
  recargo: number;
};

export type ItemSeleccionado = {
  uid: string;
  db_id?: string;
  plato_id: string;
  nombre: string;
  categoria: string;
  precio: number;
  cantidad: number;
  configurado: boolean;
  observaciones: string;
  opciones: OpcionSeleccionada[];
};

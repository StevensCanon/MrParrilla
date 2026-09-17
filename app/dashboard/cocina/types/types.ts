export type EstadoItem = "pendiente" | "preparando" | "listo";

export type TipoColumna = EstadoItem;

export type Comanda = {
  id: string;
  canal: string;
  mesa_id: string | null;
  mesero_id: string | null;
  estado: string;
  abierta_en: string;
  archivada: boolean;
};

export type ComandaItem = {
  id: string;
  comanda_id: string;
  plato_id: string;
  item_padre_id: string | null;
  opcion_id: string | null;
  menu_opcion_id: string | null;
  cantidad: number;
  observaciones: string | null;
  precio_unitario: number;
  estado: string;
};

export type Mesa = {
  id: string;
  nombre: string;
};

export type Plato = {
  id: string;
  nombre: string;
  categoria: string;
};

export type OpcionGrupo = {
  id: string;
  nombre: string;
};

export type MenuOpcion = {
  id: string;
  menu_grupo_id: string;
  opcion_id: string;
};

export type MenuGrupo = {
  id: string;
  grupo_id: string;
};

export type GrupoOpcion = {
  id: string;
  nombre: string;
};

export type OpcionCocina = {
  menu_opcion_id: string | null;
  opcion_id: string | null;
  grupo_id: string | null;
  grupo_nombre: string;
  nombre: string;
};

export type ItemCocina = ComandaItem & {
  plato: Plato | null;
  opciones: OpcionCocina[];
};

export type ComandaCocina = Comanda & {
  mesa: Mesa | null;
  items: ItemCocina[];
};

export type ColoresComanda = {
  borde: string;
  fondo: string;
  header: string;
  acento: string;
};

export type ColoresColumna = {
  fondo: string;
  borde: string;
  icono: string;
  contador: string;
};
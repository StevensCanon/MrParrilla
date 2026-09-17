export type MenuPlato = {
    id: string;
    plato_id: string;
    activo: boolean;
    platos: {
      id: string;
      nombre: string;
      categoria: string;
    } | null;
  };
  
  export type Menu = {
    id: string;
    fecha: string;
    estado: string;
    creado_en: string;
    menu_platos: MenuPlato[];
  };
  
  export type OpcionDetalle = {
    id: string;
    nombre: string;
    recargo: number;
    stock_porciones: number | null;
    activo: boolean;
    orden: number;
    porciones_preparadas: number;
    porciones_reservadas: number;
    porciones_consumidas: number;
    agotado: boolean;
  };
  
  export type GrupoDetalle = {
    id: string;
    nombre: string;
    obligatorio: boolean;
    orden: number;
    opciones: OpcionDetalle[];
  };
  
  export type MenuPlatoDetalle = {
    id: string;
    plato_id: string;
    activo: boolean;
    plato: {
      id: string;
      nombre: string;
      categoria: string;
    } | null;
    grupos: GrupoDetalle[];
  };
  
  export type MenuDetalle = {
    id: string;
    fecha: string;
    estado: string;
    creado_en: string;
    platos: MenuPlatoDetalle[];
  };
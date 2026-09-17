import type {
    ColoresColumna,
    ColoresComanda,
    TipoColumna,
  } from "../types/types";
  
  export const INTERVALO_ACTUALIZACION = 10_000;
  
  export const COLORES_COMANDA: Record<
    TipoColumna,
    ColoresComanda
  > = {
    pendiente: {
      borde: "#E9C5B9",
      fondo: "#FFFBF9",
      header: "#FFF3EF",
      acento: "#C85C3D",
    },
  
    preparando: {
      borde: "#E5D3A7",
      fondo: "#FFFDF8",
      header: "#FFF8E8",
      acento: "#C18A2B",
    },
  
    listo: {
      borde: "#BED8C7",
      fondo: "#FAFDFB",
      header: "#EFF8F2",
      acento: "#3D8060",
    },
  };
  
  export const COLORES_COLUMNA: Record<
    TipoColumna,
    ColoresColumna
  > = {
    pendiente: {
      fondo: "bg-[#FFF8F5]",
      borde: "border-[#E9C5B9]",
      icono: "bg-[#FCE7E1] text-[#A3402A]",
      contador: "bg-[#C85C3D] text-white",
    },
  
    preparando: {
      fondo: "bg-[#FFFCF5]",
      borde: "border-[#E5D3A7]",
      icono: "bg-[#F7EBCB] text-[#94691D]",
      contador: "bg-[#C18A2B] text-white",
    },
  
    listo: {
      fondo: "bg-[#F8FCF9]",
      borde: "border-[#BED8C7]",
      icono: "bg-[#DDEFE3] text-[#2E6B4F]",
      contador: "bg-[#3D8060] text-white",
    },
  };
  
  export const CONFIGURACION_COLUMNAS: Record<
    TipoColumna,
    {
      titulo: string;
      descripcion: string;
    }
  > = {
    pendiente: {
      titulo: "Pendientes",
      descripcion: "Esperando preparación",
    },
  
    preparando: {
      titulo: "En preparación",
      descripcion: "Platos en cocina",
    },
  
    listo: {
      titulo: "Listos",
      descripcion: "Pedidos terminados",
    },
  };
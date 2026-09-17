import {
    CATEGORIAS,
  } from "../constants/constants";
  
  import type {
    EstadoStock,
  } from "../types/types";
  
  export function formatoMoneda(
    valor: number,
  ): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(valor);
  }
  
  export function obtenerCategoria(
    categoria: string | null,
  ): string {
    if (!categoria) {
      return "Sin categoría";
    }
  
    return (
      CATEGORIAS.find(
        (item) => item.value === categoria,
      )?.label ?? categoria
    );
  }
  
  export function obtenerEstadoStock(
    stock: number,
    minimo: number,
  ): EstadoStock {
    if (stock <= 0) {
      return {
        label: "Agotado",
        className:
          "bg-red-50 text-red-600",
      };
    }
  
    if (stock <= minimo) {
      return {
        label: "Stock bajo",
        className:
          "bg-amber-50 text-amber-600",
      };
    }
  
    return {
      label: "Disponible",
      className:
        "bg-emerald-50 text-emerald-600",
    };
  }
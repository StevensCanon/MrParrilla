import type {
    ComandaCocina,
    EstadoItem,
  } from "../types/types";
  
  export function formatearHora(fecha: string): string {
    return new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(fecha));
  }
  
  export function tiempoTranscurrido(fecha: string): string {
    const diferencia = Date.now() - new Date(fecha).getTime();
  
    const minutos = Math.floor(diferencia / 60000);
  
    if (minutos < 1) {
      return "Hace menos de 1 min";
    }
  
    if (minutos === 1) {
      return "Hace 1 min";
    }
  
    if (minutos < 60) {
      return `Hace ${minutos} min`;
    }
  
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
  
    if (minutosRestantes === 0) {
      return `Hace ${horas} h`;
    }
  
    return `Hace ${horas} h ${minutosRestantes} min`;
  }
  
  export function obtenerTipoComanda(
    comanda: ComandaCocina,
  ): EstadoItem {
    const tienePendientes = comanda.items.some(
      (item) => item.estado === "pendiente",
    );
  
    if (tienePendientes) {
      return "pendiente";
    }
  
    const tienePreparando = comanda.items.some(
      (item) => item.estado === "preparando",
    );
  
    if (tienePreparando) {
      return "preparando";
    }
  
    return "listo";
  }
  
  export function ordenarPorAntiguedad(
    comandas: ComandaCocina[],
  ): ComandaCocina[] {
    return [...comandas].sort(
      (a, b) =>
        new Date(a.abierta_en).getTime() -
        new Date(b.abierta_en).getTime(),
    );
  }
  
  export function obtenerNumeroMesa(
    nombreMesa: string | undefined,
  ): string {
    if (!nombreMesa) {
      return "Sin mesa";
    }
  
    const coincidencia = nombreMesa.match(/\d+/);
  
    if (coincidencia) {
      return coincidencia[0];
    }
  
    return nombreMesa;
  }
import {
    Check,
    ChefHat,
    Clock3,
  } from "lucide-react";
  
  import {
    COLORES_COLUMNA,
    CONFIGURACION_COLUMNAS,
  } from "../constants/constants";
  
  import type {
    ComandaCocina,
    EstadoItem,
  } from "../types/types";
  
  import CocinaComanda from "./CocinaComanda";
  
  type CocinaColumnaProps = {
    tipo: EstadoItem;
    comandas: ComandaCocina[];
    accionando: string | null;
    onCambiarEstado: (
      itemId: string,
      estado: "preparando" | "listo",
    ) => void;
    onArchivar: (
      comandaId: string,
    ) => void;
  };
  
  export default function CocinaColumna({
    tipo,
    comandas,
    accionando,
    onCambiarEstado,
    onArchivar,
  }: CocinaColumnaProps) {
    const colores =
      COLORES_COLUMNA[tipo];
  
    const configuracion =
      CONFIGURACION_COLUMNAS[tipo];
  
    const Icono =
      tipo === "pendiente"
        ? Clock3
        : tipo === "preparando"
          ? ChefHat
          : Check;
  
    return (
      <section
        className={`flex min-h-[400px] min-w-0 flex-col rounded-2xl border ${colores.fondo} ${colores.borde}`}
      >
        <div className="flex items-center justify-between border-b border-inherit px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colores.icono}`}
            >
              <Icono className="h-5 w-5" />
            </div>
  
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-gray-900">
                {configuracion.titulo}
              </h2>
  
              <p className="truncate text-xs text-gray-500">
                {configuracion.descripcion}
              </p>
            </div>
          </div>
  
          <span
            className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${colores.contador}`}
          >
            {comandas.length}
          </span>
        </div>
  
        <div className="flex flex-1 flex-col gap-4 p-3">
          {comandas.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12 text-center">
              <div>
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${colores.icono}`}
                >
                  <Icono className="h-5 w-5" />
                </div>
  
                <p className="mt-3 text-sm font-medium text-gray-500">
                  No hay comandas
                </p>
  
                <p className="mt-1 text-xs text-gray-400">
                  Todo está al día
                </p>
              </div>
            </div>
          ) : (
            comandas.map((comanda) => (
              <CocinaComanda
                key={comanda.id}
                comanda={comanda}
                tipo={tipo}
                accionando={accionando}
                onCambiarEstado={
                  onCambiarEstado
                }
                onArchivar={onArchivar}
              />
            ))
          )}
        </div>
      </section>
    );
  }
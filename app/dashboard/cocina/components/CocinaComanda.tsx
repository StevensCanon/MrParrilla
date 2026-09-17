import {
    Archive,
    Check,
    Clock3,
    Loader2,
    MapPin,
  } from "lucide-react";
  
  import {
    COLORES_COMANDA,
  } from "../constants/constants";
  
  import type {
    ComandaCocina,
    EstadoItem,
  } from "../types/types";
  
  import {
    formatearHora,
    tiempoTranscurrido,
    obtenerNumeroMesa,
  } from "../utils/utils";
  
  import CocinaItem from "./CocinaItem";
  
  type CocinaComandaProps = {
    comanda: ComandaCocina;
    tipo: EstadoItem;
    accionando: string | null;
    onCambiarEstado: (
      itemId: string,
      estado: "preparando" | "listo",
    ) => void;
    onArchivar: (
      comandaId: string,
    ) => void;
  };
  
  export default function CocinaComanda({
    comanda,
    tipo,
    accionando,
    onCambiarEstado,
    onArchivar,
  }: CocinaComandaProps) {
    const colores =
      COLORES_COMANDA[tipo];
  
    const cantidadPendientes =
      comanda.items.filter(
        (item) => item.estado === "pendiente",
      ).length;
  
    const cantidadPreparando =
      comanda.items.filter(
        (item) => item.estado === "preparando",
      ).length;
  
    const cantidadListos =
      comanda.items.filter(
        (item) => item.estado === "listo",
      ).length;
  
    const todosListos =
      comanda.items.length > 0 &&
      comanda.items.every(
        (item) => item.estado === "listo",
      );
  
    const mesa =
      comanda.mesa?.nombre
        ? obtenerNumeroMesa(comanda.mesa.nombre)
        : null;
  
    const archivando =
      accionando === comanda.id;
  
    return (
      <article
        className="overflow-hidden rounded-2xl border shadow-sm"
        style={{
          borderColor: colores.borde,
          backgroundColor: colores.fondo,
        }}
      >
        <div
          className="border-b px-4 py-3"
          style={{
            backgroundColor: colores.header,
            borderColor: colores.borde,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold"
                  style={{
                    color: colores.acento,
                  }}
                >
                  #{comanda.id.slice(0, 6).toUpperCase()}
                </span>
  
                {mesa && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1 text-xs font-semibold text-gray-600">
                    <MapPin className="h-3 w-3" />
  
                    Mesa {mesa}
                  </span>
                )}
              </div>
  
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <Clock3 className="h-3.5 w-3.5" />
  
                <span>
                  {formatearHora(
                    comanda.abierta_en,
                  )}
                </span>
  
                <span>•</span>
  
                <span>
                  {tiempoTranscurrido(
                    comanda.abierta_en,
                  )}
                </span>
              </div>
            </div>
  
            {todosListos && (
              <button
                type="button"
                onClick={() =>
                  onArchivar(comanda.id)
                }
                disabled={archivando}
                title="Archivar comanda"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 text-gray-500 transition hover:bg-white hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {archivando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
  
          <div className="mt-3 flex flex-wrap gap-2">
            {cantidadPendientes > 0 && (
              <span className="rounded-full bg-[#FCE7E1] px-2.5 py-1 text-xs font-semibold text-[#A3402A]">
                {cantidadPendientes} pendiente
                {cantidadPendientes !== 1
                  ? "s"
                  : ""}
              </span>
            )}
  
            {cantidadPreparando > 0 && (
              <span className="rounded-full bg-[#F7EBCB] px-2.5 py-1 text-xs font-semibold text-[#94691D]">
                {cantidadPreparando} preparando
              </span>
            )}
  
            {cantidadListos > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#DDEFE3] px-2.5 py-1 text-xs font-semibold text-[#2E6B4F]">
                <Check className="h-3 w-3" />
  
                {cantidadListos} listo
                {cantidadListos !== 1
                  ? "s"
                  : ""}
              </span>
            )}
          </div>
        </div>
  
        <div className="px-4">
          {comanda.items.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Esta comanda no tiene platos.
            </div>
          ) : (
            comanda.items.map((item) => (
              <CocinaItem
                key={item.id}
                item={item}
                accionando={
                  accionando === item.id
                }
                onCambiarEstado={
                  onCambiarEstado
                }
              />
            ))
          )}
        </div>
      </article>
    );
  }
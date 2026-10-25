import type { CSSProperties } from "react";
import { Archive, Loader2 } from "lucide-react";

import {
  COLOR_ESTADO,
  FONDO_PAGINA,
  UMBRAL_ATRASO_MIN,
} from "../constants/constants";

import type { ComandaCocina, EstadoItem } from "../types/types";

import { obtenerNumeroMesa, tiempoTranscurrido } from "../utils/utils";

import CocinaItem from "./CocinaItem";

type CocinaComandaProps = {
  comanda: ComandaCocina;
  tipo: EstadoItem;
  accionando: string | null;
  onCambiarEstado: (itemId: string, estado: "preparando" | "listo") => void;
  onArchivar: (comandaId: string) => void;
};

const minutosDesde = (fecha: string) =>
  Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);

export default function CocinaComanda({
  comanda,
  tipo,
  accionando,
  onCambiarEstado,
  onArchivar,
}: CocinaComandaProps) {
  const mesa = comanda.mesa?.nombre
    ? obtenerNumeroMesa(comanda.mesa.nombre)
    : null;

  const todosListos =
    comanda.items.length > 0 &&
    comanda.items.every((item) => item.estado === "listo");

  const archivando = accionando === comanda.id;

  // "Hace 17 h 51 min" -> "17 h 51 min" (la etiqueta ya dice "Abierta hace")
  const espera = tiempoTranscurrido(comanda.abierta_en).replace(
    /^hace\s+/i,
    "",
  );
  const atrasada =
    tipo === "pendiente" &&
    minutosDesde(comanda.abierta_en) > UMBRAL_ATRASO_MIN;

  return (
    <article
      aria-label={mesa ? `Comanda de la mesa ${mesa}` : "Comanda"}
      style={{ "--barra": COLOR_ESTADO[tipo] } as CSSProperties}
      className="relative rounded-2xl bg-white px-3 pb-2 pt-4 shadow-[inset_0_3px_0_0_var(--barra),0_1px_2px_rgba(34,32,29,0.06),0_10px_20px_-16px_rgba(34,32,29,0.24)] sm:px-4 sm:pt-4"
    >
      {/* Encabezado: mesa como etiqueta y tiempo abierta */}
      <header className="flex items-center gap-3">
        <div
          role="img"
          aria-label={mesa ? `Mesa ${mesa}` : "Sin mesa"}
          className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border border-[#E2DCD0] bg-[#F4F2ED] text-[#22201D]"
        >
          <span className="mb-0.5 text-[9px] font-semibold leading-none text-[#6F695E]">
            Mesa
          </span>
          <span className="text-2xl font-extrabold leading-none">
            {mesa ?? "–"}
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-[#6F695E]">
            Abierta hace
          </span>
          <span
            className={`text-base font-bold leading-tight tabular-nums sm:text-lg ${
              atrasada ? "text-[#B3261E]" : "text-[#22201D]"
            }`}
          >
            {espera}
          </span>
        </div>
      </header>

      {/* Línea de ticket con muescas laterales */}
      <div
        aria-hidden="true"
        className="relative -mx-3 my-3 border-t border-dashed border-[#DDD6C9] sm:-mx-4 sm:my-3"
      >
        <span
          className="absolute -left-2 -top-[9px] size-4 rounded-full"
          style={{ backgroundColor: FONDO_PAGINA }}
        />
        <span
          className="absolute -right-2 -top-[9px] size-4 rounded-full"
          style={{ backgroundColor: FONDO_PAGINA }}
        />
      </div>

      {comanda.items.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#6F695E]">
          Esta comanda no tiene platos.
        </p>
      ) : (
        <div>
          {comanda.items.map((item) => (
            <CocinaItem
              key={item.id}
              item={item}
              accionando={accionando === item.id}
              onCambiarEstado={onCambiarEstado}
            />
          ))}
        </div>
      )}

      {todosListos && (
        <div className="border-t border-[#EFEBE3] pt-2">
          <button
            type="button"
            onClick={() => onArchivar(comanda.id)}
            disabled={archivando}
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#CFC8BA] bg-white text-sm font-semibold text-[#22201D] transition-colors hover:bg-[#F4F2ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22201D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {archivando ? (
              <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Archive size={16} aria-hidden="true" />
            )}
            Archivar comanda
          </button>
        </div>
      )}
    </article>
  );
}

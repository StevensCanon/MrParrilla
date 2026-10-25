import { Check, Loader2, Play } from "lucide-react";

import type { ItemCocina } from "../types/types";

type CocinaItemProps = {
  item: ItemCocina;
  accionando: boolean;
  onCambiarEstado: (itemId: string, estado: "preparando" | "listo") => void;
};

const botonAccion =
  "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#CFC8BA] bg-white px-3 text-sm font-semibold text-[#22201D] transition-colors hover:bg-[#F4F2ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22201D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4";

export default function CocinaItem({
  item,
  accionando,
  onCambiarEstado,
}: CocinaItemProps) {
  const nombre = item.plato?.nombre ?? "Plato no encontrado";

  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1.5 py-2.5 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-[#EFEBE3] sm:grid-cols-[1.75rem_minmax(0,1fr)_auto] sm:items-center">
      {/* Cantidad */}
      <span
        aria-label={`${item.cantidad} unidades`}
        className="flex size-7 items-center justify-center rounded-lg border border-[#D9D3C7] text-xs font-bold tabular-nums text-[#22201D]"
      >
        {item.cantidad}
      </span>

      {/* Plato, opciones y nota */}
      <div className="min-w-0">
        <h4 className="text-sm font-semibold leading-snug text-[#22201D] sm:text-base">
          {nombre}
        </h4>

        {item.opciones.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {item.opciones.map((opcion, index) => (
              <p
                key={`${opcion.menu_opcion_id ?? opcion.opcion_id ?? "opcion"}-${index}`}
                className="text-xs leading-4 text-[#6F695E]"
              >
                <span className="font-medium">{opcion.grupo_nombre}:</span>{" "}
                {opcion.nombre}
              </p>
            ))}
          </div>
        )}

        {item.observaciones && (
          <p className="mt-1 text-xs leading-4 text-[#4F4A43]">
            <span className="font-semibold">Nota:</span> {item.observaciones}
          </p>
        )}
      </div>

      {/* Acción según el estado del plato */}
      {item.estado === "pendiente" && (
        <button
          type="button"
          onClick={() => onCambiarEstado(item.id, "preparando")}
          disabled={accionando}
          aria-label={`Preparar ${nombre}`}
          className={`${botonAccion} col-start-2 justify-self-start sm:col-start-auto`}
        >
          {accionando ? (
            <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Play size={14} fill="currentColor" aria-hidden="true" />
          )}
          Preparar
        </button>
      )}

      {item.estado === "preparando" && (
        <button
          type="button"
          onClick={() => onCambiarEstado(item.id, "listo")}
          disabled={accionando}
          aria-label={`Marcar listo ${nombre}`}
          className={`${botonAccion} col-start-2 justify-self-start sm:col-start-auto`}
        >
          {accionando ? (
            <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Check size={15} strokeWidth={3} aria-hidden="true" />
          )}
          Listo
        </button>
      )}

      {item.estado === "listo" && (
        <span className="col-start-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2E6B4F] sm:col-start-auto">
          <Check size={15} strokeWidth={3} aria-hidden="true" />
          Listo
        </span>
      )}
    </div>
  );
}

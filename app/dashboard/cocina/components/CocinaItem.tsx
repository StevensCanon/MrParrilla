import {
    Check,
    Loader2,
    Play,
  } from "lucide-react";
  
  import type {
    ItemCocina,
  } from "../types/types";
  
  type CocinaItemProps = {
    item: ItemCocina;
    accionando: boolean;
    onCambiarEstado: (
      itemId: string,
      estado: "preparando" | "listo",
    ) => void;
  };
  
  export default function CocinaItem({
    item,
    accionando,
    onCambiarEstado,
  }: CocinaItemProps) {
    const estaPendiente =
      item.estado === "pendiente";
  
    const estaPreparando =
      item.estado === "preparando";
  
    const estaListo =
      item.estado === "listo";
  
    return (
      <div className="border-b border-gray-100 py-4 last:border-b-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 px-2 text-xs font-bold text-gray-700">
                {item.cantidad}x
              </span>
  
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900">
                  {item.plato?.nombre ??
                    "Plato no encontrado"}
                </h4>
  
                {item.plato?.categoria && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {item.plato.categoria}
                  </p>
                )}
              </div>
            </div>
  
            {item.opciones.length > 0 && (
              <div className="mt-3 space-y-1.5 pl-9">
                {item.opciones.map((opcion, index) => (
                  <div
                    key={`${opcion.menu_opcion_id ?? opcion.opcion_id ?? "opcion"}-${index}`}
                    className="text-sm"
                  >
                    <span className="font-medium text-gray-500">
                      {opcion.grupo_nombre}:
                    </span>{" "}
                    <span className="text-gray-700">
                      {opcion.nombre}
                    </span>
                  </div>
                ))}
              </div>
            )}
  
            {item.observaciones && (
              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                <span className="font-semibold">
                  Nota:
                </span>{" "}
                {item.observaciones}
              </div>
            )}
          </div>
  
          <div className="shrink-0">
            {estaPendiente && (
              <button
                type="button"
                onClick={() =>
                  onCambiarEstado(
                    item.id,
                    "preparando",
                  )
                }
                disabled={accionando}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#C85C3D] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#B44E31] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {accionando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
  
                Preparar
              </button>
            )}
  
            {estaPreparando && (
              <button
                type="button"
                onClick={() =>
                  onCambiarEstado(
                    item.id,
                    "listo",
                  )
                }
                disabled={accionando}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D8060] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#326B50] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {accionando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
  
                Marcar listo
              </button>
            )}
  
            {estaListo && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAF3EE] px-3 py-2 text-xs font-semibold text-[#2E6B4F]">
                <Check className="h-4 w-4" />
  
                Listo
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
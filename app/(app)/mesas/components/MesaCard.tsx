
"use client";

import Image from "next/image";
import {
  GitMerge,
  Pencil,
  Receipt,
  Trash2,
} from "lucide-react";

import type { Mesa } from "../types/types";
import { money, obtenerNumeroMesa } from "../utils/utils";

type MesaCardProps = {
  mesa: Mesa;
  mesaPrincipal: Mesa | null;
  mesasUnidas: Mesa[];
  ocupada: boolean;
  total: number;
  esAdmin: boolean;
  puedeGestionarCaja: boolean;
  eliminandoMesa: boolean;
  onAbrir: (mesa: Mesa) => void;
  onEditar: (
    event: React.MouseEvent<HTMLButtonElement>,
    mesa: Mesa,
  ) => void;
  onEliminar: (
    event: React.MouseEvent<HTMLButtonElement>,
    mesa: Mesa,
  ) => void;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F695E] focus-visible:ring-offset-2";

export function MesaCard({
  mesa,
  mesaPrincipal,
  mesasUnidas,
  ocupada,
  total,
  esAdmin,
  puedeGestionarCaja,
  eliminandoMesa,
  onAbrir,
  onEditar,
  onEliminar,
}: MesaCardProps) {
  const numero = obtenerNumeroMesa(mesa.nombre);

  const numeroPrincipal = mesaPrincipal
    ? obtenerNumeroMesa(mesaPrincipal.nombre)
    : null;

  const numerosUnidos = mesasUnidas.map((actual) =>
    obtenerNumeroMesa(actual.nombre),
  );

  const esParteUnida = Boolean(mesaPrincipal);
  const tieneGrupoUnido = mesasUnidas.length > 0;

  const mostrarTotal =
    puedeGestionarCaja && ocupada && !esParteUnida;

  const textoUnion = esParteUnida
    ? `Unida a mesa ${numeroPrincipal}`
    : tieneGrupoUnido
      ? `Con mesa${mesasUnidas.length > 1 ? "s" : ""} ${numerosUnidos.join(", ")}`
      : null;

  const etiquetaAccesible = [
    `Mesa ${numero}`,
    ocupada ? "ocupada" : "libre",
    textoUnion,
    mostrarTotal ? `total ${money(total)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      className={`group relative flex min-h-[190px] flex-col items-center justify-between rounded-xl border bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 motion-reduce:transition-none ${
        ocupada
          ? "border-[#D8D0C3]"
          : "border-[#E4DED3]"
      } hover:-translate-y-0.5 hover:border-[#B9B1A3] hover:shadow-md focus-within:border-[#B9B1A3] focus-within:shadow-md`}
    >
      {/* Estado permanente, discreto y sin punto */}
      <span
        className={`absolute left-3 top-3 rounded-full border px-2 py-1 text-[9px] font-semibold tracking-wide ${
          ocupada
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}
      >
        {ocupada ? "Ocupada" : "Libre"}
      </span>

      {/* Acciones administrativas: hover, teclado y pantallas táctiles */}
      {esAdmin && (
        <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 motion-reduce:transition-none">
          <button
            type="button"
            onClick={(event) => onEditar(event, mesa)}
            aria-label={`Editar mesa ${numero}`}
            title="Editar mesa"
            className={`flex size-8 items-center justify-center rounded-md border border-[#E4DED3] bg-white text-[#6F695E] shadow-sm transition-colors hover:bg-[#F5F2ED] hover:text-[#22201D] ${focusRing}`}
          >
            <Pencil size={14} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(event) => onEliminar(event, mesa)}
            disabled={eliminandoMesa || ocupada}
            aria-label={`Eliminar mesa ${numero}`}
            title={
              ocupada
                ? "No puedes eliminar una mesa ocupada"
                : eliminandoMesa
                  ? "Eliminando mesa..."
                  : "Eliminar mesa"
            }
            className={`flex size-8 items-center justify-center rounded-md border border-[#E4DED3] bg-white text-[#A3402A] shadow-sm transition-colors hover:border-red-200 hover:bg-[#FFF5F2] disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Imagen de la Mesa */}
      <button
        type="button"
        onClick={() => onAbrir(mesa)}
        aria-label={etiquetaAccesible}
        className={`relative mt-8 flex h-40 w-50 max-w-full shrink-0 items-center justify-center ${focusRing}`}
      >
        <Image
          src="/mesa.png"
          alt=""
          fill
          sizes="200px"
          className="object-contain"
          loading="eager"
        />

        <span className="pointer-events-none relative pb-3 text-3xl font-semibold leading-none tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
          {numero}
        </span>

        {/* Total centrado sobre la imagen */}
        {mostrarTotal && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/25 opacity-0 backdrop-blur-[2px] transition-[opacity,backdrop-filter] duration-200 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
          >
            <span className="w-[160px] max-w-[calc(100%-16px)] rounded-xl border border-[#D8D0C3] bg-white/95 px-4 py-3 text-left shadow-xl">
              <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A8375]">
                <Receipt size={13} aria-hidden="true" />
                Total mesa
              </span>

              <span className="mt-1 block font-mono text-lg font-semibold tabular-nums text-[#22201D]">
                {money(total)}
              </span>

              <span className="mt-1 block text-[10px] leading-relaxed text-[#8A8375]">
                Haz clic para ver el detalle
              </span>
            </span>
          </span>
        )}
      </button>

      {/* Nombre y relación entre mesas */}
      <div className="mt-1 flex w-full min-w-0 flex-col items-center gap-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-[#8A8375]">
          Mesa {numero}
        </p>

        {textoUnion && (
          <p
            title={textoUnion}
            className="flex max-w-full items-center justify-center gap-1.5 text-[11px] text-[#766E62]"
          >
            <GitMerge
              size={13}
              className="shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{textoUnion}</span>
          </p>
        )}
      </div>
    </article>
  );
}

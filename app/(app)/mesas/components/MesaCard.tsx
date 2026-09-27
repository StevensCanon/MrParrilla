"use client";

import Image from "next/image";
import {
  Pencil,
  Receipt,
  Trash2,
} from "lucide-react";

import type { Mesa } from "../types/types";
import { money, obtenerNumeroMesa } from "../utils/utils";

type MesaCardProps = {
  mesa: Mesa;
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

export function MesaCard({
  mesa,
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

  return (
    <div
      className={`group relative flex min-h-[190px] flex-col items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        ocupada
          ? "border-[#D8D0C3]"
          : "border-[#E4DED3]"
      }`}
    >
      <span
        className={`absolute right-2 top-2 rounded-full px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide shadow-sm ${
          ocupada
            ? "bg-red-800 text-white"
            : "bg-green-700 text-white"
        }`}
      >
        {ocupada ? "Ocupada" : "Libre"}
      </span>

      <button
        type="button"
        onClick={() => onAbrir(mesa)}
        className="relative mt-2 flex h-40 w-50 items-center justify-center"
      >
        <Image
          src="/mesa.png"
          alt=""
          fill
          className="object-contain"
          loading="eager"
        />

        <span className="pointer-events-none relative pb-3 text-3xl font-semibold leading-none text-white">
          {numero}
        </span>

        {puedeGestionarCaja && ocupada && (
          <div className="pointer-events-none absolute w-[160px] rounded-lg border border-[#D8D0C3] bg-white px-4 py-3 text-left opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A8375]">
              <Receipt size={13} />
              Total mesa
            </div>

            <p className="mt-1 font-mono text-lg font-semibold text-[#22201D]">
              {money(total)}
            </p>

            <p className="mt-1 text-[10px] text-[#8A8375]">
              Haz clic para ver el detalle
            </p>
          </div>
        )}
      </button>

      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#8A8375]">
        Mesa {numero}
      </p>

      {esAdmin && (
        <div className="mt-3 flex gap-1.5">
          <button
            type="button"
            onClick={(event) => onEditar(event, mesa)}
            className="flex size-7 items-center justify-center rounded-md border border-zinc-400 bg-white text-[#6F695E] transition hover:bg-[#F5F2ED] hover:text-[#22201D]"
            title="Editar mesa"
          >
            <Pencil size={13} />
          </button>

          <button
            type="button"
            onClick={(event) => onEliminar(event, mesa)}
            disabled={eliminandoMesa || ocupada}
            className="flex size-7 items-center justify-center rounded-md border border-red-500 bg-white text-[#A3402A] transition hover:bg-[#FFF5F2] disabled:cursor-not-allowed disabled:opacity-40"
            title={
              ocupada
                ? "No puedes eliminar una mesa ocupada"
                : "Eliminar mesa"
            }
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
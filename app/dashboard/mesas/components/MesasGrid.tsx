"use client";

import { Utensils } from "lucide-react";

import type { Mesa } from "../types/types";
import { MesaCard } from "./MesaCard";

type MesasGridProps = {
  mesas: Mesa[];
  esAdmin: boolean;
  esCajero: boolean;
  eliminandoMesa: boolean;
  estaOcupada: (mesaId: string) => boolean;
  obtenerTotalMesa: (mesaId: string) => number;
  onAbrirMesa: (mesa: Mesa) => void;
  onEditarMesa: (
    event: React.MouseEvent<HTMLButtonElement>,
    mesa: Mesa,
  ) => void;
  onEliminarMesa: (
    event: React.MouseEvent<HTMLButtonElement>,
    mesa: Mesa,
  ) => void;
};

export function MesasGrid({
  mesas,
  esAdmin,
  esCajero,
  eliminandoMesa,
  estaOcupada,
  obtenerTotalMesa,
  onAbrirMesa,
  onEditarMesa,
  onEliminarMesa,
}: MesasGridProps) {
  if (mesas.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center border border-[#E4DED3] bg-white">
        <Utensils
          size={32}
          className="text-[#B8B1A4]"
        />

        <p className="mt-3 text-sm font-medium text-[#22201D]">
          No hay mesas
        </p>

        <p className="mt-1 text-xs text-[#8A8375]">
          Crea tu primera mesa para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {mesas.map((mesa) => {
        const ocupada = estaOcupada(mesa.id);

        return (
          <MesaCard
            key={mesa.id}
            mesa={mesa}
            ocupada={ocupada}
            total={
              ocupada
                ? obtenerTotalMesa(mesa.id)
                : 0
            }
            esAdmin={esAdmin}
            esCajero={esCajero}
            eliminandoMesa={eliminandoMesa}
            onAbrir={onAbrirMesa}
            onEditar={onEditarMesa}
            onEliminar={onEliminarMesa}
          />
        );
      })}
    </div>
  );
}
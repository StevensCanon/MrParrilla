import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Plato } from "../types/types";
import {
  formatearCategoria,
  formatearDinero,
  obtenerClasePuntoCategoria,
} from "../utils/utils";

type PlatoFilaProps = {
  plato: Plato;
  onEditar: (plato: Plato) => void;
  onCambiarDisponibilidad: (plato: Plato) => void;
  onEliminar: (plato: Plato) => void;
};

// Sin espacio entre el signo y la cifra: "$2.000"
const precio = (valor: number) => formatearDinero(valor).replace(/\s/g, "");

export default function PlatoFila({
  plato,
  onEditar,
  onCambiarDisponibilidad,
  onEliminar,
}: PlatoFilaProps) {
  const agotado = !plato.disponible;

  return (
    <div className="flex items-center gap-3 border-b border-[#E7E4DC] px-4 py-3.5 last:border-0 hover:bg-black/[0.015] sm:gap-4 sm:px-5">
      {/* Nombre + categoría (los platos agotados se atenúan) */}
      <button
        type="button"
        onClick={() => onEditar(plato)}
        className={`min-w-0 flex-1 text-left transition-opacity ${
          agotado ? "opacity-55" : ""
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-medium text-[#211F1B]">
            {plato.nombre}
          </span>
          {agotado && (
            <span className="shrink-0 rounded-full bg-[#EFEDE6] px-2 py-0.5 text-xs font-medium text-[#5F5A4F]">
              Agotado
            </span>
          )}
        </span>

        {/* Solo móvil: en escritorio la categoría tiene su propia columna */}
        <span className="mt-0.5 block text-[13px] text-[#6F695E] sm:hidden">
          {formatearCategoria(plato.categoria)}
          <span className="tabular-nums">
            {" · "}
            {precio(plato.precio)}
          </span>
        </span>
      </button>

      {/* Categoría: punto de color + texto neutro */}
      <span
        className={`hidden w-32 shrink-0 items-center gap-2 text-sm text-[#5F5A4F] sm:flex ${
          agotado ? "opacity-55" : ""
        }`}
      >
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 rounded-full ${obtenerClasePuntoCategoria(
            plato.categoria,
          )}`}
        />
        <span className="truncate">{formatearCategoria(plato.categoria)}</span>
      </span>

      {/* Precio */}
      <span
        className={`hidden w-24 shrink-0 text-right text-[15px] font-medium tabular-nums text-[#211F1B] sm:block ${
          agotado ? "opacity-55" : ""
        }`}
      >
        {precio(plato.precio)}
      </span>

      {/* Disponibilidad */}
      <div className="flex w-14 shrink-0 justify-center sm:w-20">
        <button
          type="button"
          role="switch"
          aria-checked={plato.disponible}
          onClick={() => onCambiarDisponibilidad(plato)}
          aria-label={
            plato.disponible
              ? `Marcar ${plato.nombre} como agotado`
              : `Marcar ${plato.nombre} como disponible`
          }
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#211F1B]/30 focus-visible:ring-offset-2 ${
            plato.disponible ? "bg-[#211F1B]" : "bg-[#D8D4C8]"
          }`}
        >
          <span
            className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${
              plato.disponible ? "left-[24px]" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Acciones */}
      <div className="flex w-10 shrink-0 justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Acciones para ${plato.nombre}`}
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="inline-flex size-10 items-center justify-center rounded-full text-[#6F695E] transition hover:bg-black/[0.05] focus:outline-none"
              />
            }
          >
            <MoreHorizontal size={18} />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48 rounded-[12px]">
            <DropdownMenuItem onClick={() => onEditar(plato)}>
              <Pencil size={15} />
              Editar
            </DropdownMenuItem>


            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => onEliminar(plato)}
            >
              <Trash2 size={15} />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
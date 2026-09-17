import {
    MoreHorizontal,
    Pencil,
    Power,
    Trash2,
  } from "lucide-react";
  
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
  
  export default function PlatoFila({
    plato,
    onEditar,
    onCambiarDisponibilidad,
    onEliminar,
  }: PlatoFilaProps) {
    return (
      <div className="flex items-center gap-3 border-b border-[#E7E4DC] px-4 py-3 last:border-0 hover:bg-black/[0.015] sm:gap-4 sm:px-5">
        <span
          className={`
            hidden size-2 shrink-0 rounded-full sm:block
            ${obtenerClasePuntoCategoria(plato.categoria)}
          `}
        />
  
        <button
          type="button"
          onClick={() => onEditar(plato)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block truncate text-[15px] font-medium text-[#211F1B]">
            {plato.nombre}
          </span>
  
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#8A8577] sm:hidden">
            <span>{formatearCategoria(plato.categoria)}</span>
            <span>·</span>
            <span className="tabular-nums">
              {formatearDinero(plato.precio)}
            </span>
          </span>
        </button>
  
        <span className="hidden w-28 shrink-0 truncate text-sm text-[#8A8577] sm:block">
          {formatearCategoria(plato.categoria)}
        </span>
  
        <span className="hidden w-24 shrink-0 text-right text-sm tabular-nums text-[#8A8577] sm:block">
          {formatearDinero(plato.precio)}
        </span>
  
        <div className="flex w-16 shrink-0 justify-center">
          <button
            type="button"
            onClick={() => onCambiarDisponibilidad(plato)}
            aria-pressed={plato.disponible}
            aria-label={
              plato.disponible
                ? "Marcar no disponible"
                : "Marcar disponible"
            }
            className={`
              relative h-6 w-11 shrink-0 rounded-full
              transition-colors
              ${
                plato.disponible
                  ? "bg-[#2FA36B]"
                  : "bg-[#D8D4C8]"
              }
            `}
          >
            <span
              className={`
                absolute top-1 size-4 rounded-full bg-white
                shadow transition-all
                ${
                  plato.disponible
                    ? "left-[22px]"
                    : "left-1"
                }
              `}
            />
          </button>
        </div>
  
        <div className="w-8 shrink-0 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Acciones para ${plato.nombre}`}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="inline-flex size-8 items-center justify-center rounded-full text-[#8A8577] transition hover:bg-black/[0.04] focus:outline-none"
                />
              }
            >
              <MoreHorizontal size={17} />
            </DropdownMenuTrigger>
  
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-[12px]"
            >
              <DropdownMenuItem
                onClick={() => onEditar(plato)}
              >
                <Pencil size={15} />
                Editar
              </DropdownMenuItem>
  
              <DropdownMenuItem
                onClick={() =>
                  onCambiarDisponibilidad(plato)
                }
              >
                <Power size={15} />
  
                {plato.disponible
                  ? "Desactivar"
                  : "Activar"}
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
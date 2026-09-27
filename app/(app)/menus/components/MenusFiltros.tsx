"use client";

import { CalendarDays, Search, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type MenusFiltrosProps = {
  fechaExacta: string;
  fechaDesde: string;
  fechaHasta: string;
  cantidadResultados: number;
  hayFiltros: boolean;
  onFechaExactaChange: (valor: string) => void;
  onFechaDesdeChange: (valor: string) => void;
  onFechaHastaChange: (valor: string) => void;
  onLimpiar: () => void;
};

function convertirStringAFecha(valor: string): Date | undefined {
  if (!valor) return undefined;

  const [year, month, day] = valor.split("-").map(Number);

  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day);
}

function convertirFechaAString(fecha: Date | undefined): string {
  if (!fecha) return "";

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatearFecha(valor: string): string {
  const fecha = convertirStringAFecha(valor);

  if (!fecha) return "Seleccionar fecha";

  return format(fecha, "dd/MM/yyyy", {
    locale: es,
  });
}

export default function MenusFiltros({
  fechaExacta,
  fechaDesde,
  fechaHasta,
  cantidadResultados,
  hayFiltros,
  onFechaExactaChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onLimpiar,
}: MenusFiltrosProps) {
  const rangoSeleccionado: DateRange | undefined =
    fechaDesde || fechaHasta
      ? {
          from: convertirStringAFecha(fechaDesde),
          to: convertirStringAFecha(fechaHasta),
        }
      : undefined;

  const seleccionarFechaExacta = (fecha: Date | undefined) => {
    const valor = convertirFechaAString(fecha);

    onFechaExactaChange(valor);

    if (valor) {
      onFechaDesdeChange("");
      onFechaHastaChange("");
    }
  };

  const seleccionarRango = (rango: DateRange | undefined) => {
    const desde = convertirFechaAString(rango?.from);
    const hasta = convertirFechaAString(rango?.to);

    onFechaDesdeChange(desde);
    onFechaHastaChange(hasta);

    if (desde || hasta) {
      onFechaExactaChange("");
    }
  };

  return (
    <section className="mb-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-zinc-500" />

          <h2 className="text-sm font-semibold text-zinc-900">Filtrar menús</h2>
        </div>

        <p className="text-xs text-zinc-500">
          Busca un día específico o un rango de fechas.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2 ">
        {/* FECHA EXACTA */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Fecha exacta
          </label>

          <Popover>
            <PopoverTrigger
              className="
      flex
      h-10
      w-full
      items-center
      rounded-xl
      border
      border-zinc-200
      bg-white
      px-3
      text-left
      text-sm
      font-normal
      text-zinc-800
      outline-none
      transition
      hover:bg-zinc-50
      focus:border-zinc-400
      focus:ring-2
      focus:ring-zinc-100
    "
            >
              <CalendarDays size={16} className="mr-2 shrink-0 text-zinc-400" />

              <span className={fechaExacta ? "text-zinc-800" : "text-zinc-400"}>
                {fechaExacta
                  ? formatearFecha(fechaExacta)
                  : "Seleccionar fecha"}
              </span>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-auto rounded-xl p-0">
              <Calendar
                mode="single"
                selected={convertirStringAFecha(fechaExacta)}
                onSelect={seleccionarFechaExacta}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* RANGO DE FECHAS */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
            Rango de fechas
          </label>

          <Popover>
            <PopoverTrigger
              className="
      flex
      h-10
      w-full
      items-center
      justify-start
      rounded-xl
      border
      border-zinc-200
      bg-white
      px-3
      text-left
      text-sm
      font-normal
      text-zinc-800
      outline-none
      transition
      hover:bg-zinc-50
      focus:border-zinc-400
      focus:ring-2
      focus:ring-zinc-100
    "
            >
              <CalendarDays size={16} className="mr-2 shrink-0 text-zinc-400" />

              {fechaDesde && fechaHasta ? (
                <span className="text-zinc-800">
                  {formatearFecha(fechaDesde)} - {formatearFecha(fechaHasta)}
                </span>
              ) : fechaDesde ? (
                <span className="text-zinc-800">
                  Desde {formatearFecha(fechaDesde)}
                </span>
              ) : (
                <span className="text-zinc-400">Seleccionar rango</span>
              )}
            </PopoverTrigger>

            <PopoverContent align="start" className="w-auto rounded-xl p-0">
              <Calendar
                mode="range"
                selected={rangoSeleccionado}
                onSelect={seleccionarRango}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {hayFiltros && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <p className="text-xs text-zinc-500">
              {cantidadResultados}{" "}
              {cantidadResultados === 1
                ? "menú encontrado"
                : "menús encontrados"}
            </p>

            <button
              type="button"
              onClick={onLimpiar}
              className="
              inline-flex
              items-center
              gap-1.5
              rounded-lg
              px-2.5
              py-1.5
              text-xs
              font-medium
              text-zinc-500
              transition
              hover:bg-zinc-100
              hover:text-zinc-900
            "
            >
              <X size={14} />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import { CalendarDays, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DashboardDateFilterProps = {
  fechaExacta: string;
  fechaDesde: string;
  fechaHasta: string;
  onFechaExactaChange: (valor: string) => void;
  onFechaDesdeChange: (valor: string) => void;
  onFechaHastaChange: (valor: string) => void;
  onLimpiar: () => void;
};

function aFecha(valor: string): Date | undefined {
  if (!valor) return undefined;
  const [year, month, day] = valor.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function aValor(fecha: Date | undefined): string {
  if (!fecha) return "";
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

function etiqueta(valor: string): string {
  const fecha = aFecha(valor);
  return fecha ? format(fecha, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha";
}

export function DashboardDateFilter({
  fechaExacta,
  fechaDesde,
  fechaHasta,
  onFechaExactaChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onLimpiar,
}: DashboardDateFilterProps) {
  const rango: DateRange | undefined =
    fechaDesde || fechaHasta
      ? { from: aFecha(fechaDesde), to: aFecha(fechaHasta) }
      : undefined;

  const seleccionarExacta = (fecha: Date | undefined) => {
    const valor = aValor(fecha);
    onFechaExactaChange(valor);
    if (valor) {
      onFechaDesdeChange("");
      onFechaHastaChange("");
    }
  };

  const seleccionarRango = (seleccion: DateRange | undefined) => {
    onFechaDesdeChange(aValor(seleccion?.from));
    onFechaHastaChange(aValor(seleccion?.to));
    if (seleccion?.from) onFechaExactaChange("");
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[#E7E1D7] bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-5">
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#6F695E]">
            Fecha exacta
          </label>
          <Popover>
            <PopoverTrigger className="flex h-10 w-full items-center rounded-xl border border-[#E7E1D7] bg-white px-3 text-left text-sm text-[#22201D] outline-none transition hover:bg-[#F8F6F1] focus:ring-2 focus:ring-[#F3D7CE]">
              <CalendarDays size={16} className="mr-2 shrink-0 text-[#C85C3D]" />
              <span className={fechaExacta ? "" : "text-[#8A8375]"}>
                {fechaExacta ? etiqueta(fechaExacta) : "Seleccionar fecha"}
              </span>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto rounded-xl p-0">
              <Calendar
                mode="single"
                selected={aFecha(fechaExacta)}
                onSelect={seleccionarExacta}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#6F695E]">
            Rango de fechas
          </label>
          <Popover>
            <PopoverTrigger className="flex h-10 w-full items-center justify-start rounded-xl border border-[#E7E1D7] bg-white px-3 text-left text-sm text-[#22201D] outline-none transition hover:bg-[#F8F6F1] focus:ring-2 focus:ring-[#F3D7CE]">
              <CalendarDays size={16} className="mr-2 shrink-0 text-[#C85C3D]" />
              {fechaDesde && fechaHasta ? (
                <span>{etiqueta(fechaDesde)} – {etiqueta(fechaHasta)}</span>
              ) : fechaDesde ? (
                <span>Desde {etiqueta(fechaDesde)}</span>
              ) : (
                <span className="text-[#8A8375]">Seleccionar rango</span>
              )}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto rounded-xl p-0">
              <Calendar
                mode="range"
                selected={rango}
                onSelect={seleccionarRango}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <button
        type="button"
        onClick={onLimpiar}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#E7E1D7] px-3 text-sm font-medium text-[#6F695E] transition hover:bg-[#F8F6F1] hover:text-[#22201D]"
      >
        <RotateCcw size={15} />
        Últimos 14 días
      </button>
    </section>
  );
}

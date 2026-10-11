"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Periodo = "hoy" | "semana" | "mes" | "personalizado";

type DashboardDateFilterProps = {
  fechaExacta: string;
  fechaDesde: string;
  fechaHasta: string;
  onFechaExactaChange: (valor: string) => void;
  onFechaDesdeChange: (valor: string) => void;
  onFechaHastaChange: (valor: string) => void;
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
  return fecha
    ? format(fecha, "dd/MM/yyyy", { locale: es })
    : "Seleccionar fecha";
}

function inicioSemana(fecha: Date): Date {
  const inicio = new Date(fecha);
  const dia = inicio.getDay();
  inicio.setDate(inicio.getDate() - (dia === 0 ? 6 : dia - 1));
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function fechaHoy(): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

export function DashboardDateFilter({
  fechaExacta,
  fechaDesde,
  fechaHasta,
  onFechaExactaChange,
  onFechaDesdeChange,
  onFechaHastaChange,
}: DashboardDateFilterProps) {
  const [periodo, setPeriodo] = useState<Periodo>("semana");

  const rango: DateRange | undefined =
    fechaDesde || fechaHasta
      ? { from: aFecha(fechaDesde), to: aFecha(fechaHasta) }
      : undefined;

  const aplicarPeriodo = (nuevoPeriodo: Exclude<Periodo, "personalizado">) => {
    const hoy = fechaHoy();
    let desde = hoy;

    if (nuevoPeriodo === "semana") {
      desde = inicioSemana(hoy);
    } else if (nuevoPeriodo === "mes") {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }

    onFechaExactaChange("");
    onFechaDesdeChange(aValor(desde));
    onFechaHastaChange(aValor(hoy));
    setPeriodo(nuevoPeriodo);
  };

  const seleccionarExacta = (fecha: Date | undefined) => {
    const valor = aValor(fecha);
    onFechaExactaChange(valor);
    if (valor) {
      onFechaDesdeChange("");
      onFechaHastaChange("");
    }
    setPeriodo("personalizado");
  };

  const seleccionarRango = (seleccion: DateRange | undefined) => {
    onFechaDesdeChange(aValor(seleccion?.from));
    onFechaHastaChange(aValor(seleccion?.to));
    if (seleccion?.from) onFechaExactaChange("");
    setPeriodo("personalizado");
  };

  const opciones: { valor: Exclude<Periodo, "personalizado">; texto: string }[] = [
    { valor: "hoy", texto: "Hoy" },
    { valor: "semana", texto: "Esta semana" },
    { valor: "mes", texto: "Este mes" },
  ];

  return (
    <section className="rounded-2xl border border-[#E7E1D7] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#22201D]">Periodo</h2>
          <p className="mt-1 text-xs text-[#8A8375]">
            Filtra las ventas y la operación por fecha.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {opciones.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => aplicarPeriodo(opcion.valor)}
              aria-pressed={periodo === opcion.valor}
              className={`h-10 rounded-xl border px-4 text-sm font-medium transition ${
                periodo === opcion.valor
                  ? "border-[#C85C3D] bg-[#FFF0EA] text-[#A3402A]"
                  : "border-[#E7E1D7] bg-white text-[#6F695E] hover:bg-[#F8F6F1]"
              }`}
            >
              {opcion.texto}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPeriodo("personalizado")}
            aria-pressed={periodo === "personalizado"}
            className={`h-10 rounded-xl border px-4 text-sm font-medium transition ${
              periodo === "personalizado"
                ? "border-[#C85C3D] bg-[#FFF0EA] text-[#A3402A]"
                : "border-[#E7E1D7] bg-white text-[#6F695E] hover:bg-[#F8F6F1]"
            }`}
          >
            Personalizado
          </button>
        </div>
      </div>

      {periodo === "personalizado" && (
        <div className="mt-4 grid gap-3 border-t border-[#F0ECE5] pt-4 sm:grid-cols-2">
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
      )}
    </section>
  );
}

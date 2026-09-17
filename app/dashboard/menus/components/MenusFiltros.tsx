import {
    CalendarDays,
    Search,
    X,
  } from 'lucide-react';
  
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
    return (
      <section className="mb-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Search
              size={16}
              className="text-zinc-500"
            />
  
            <h2 className="text-sm font-semibold text-zinc-900">
              Filtrar menús
            </h2>
          </div>
  
          <p className="text-xs text-zinc-500">
            Busca un día específico o un rango de fechas.
          </p>
        </div>
  
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label
              htmlFor="fecha-exacta"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              Fecha exacta
            </label>
  
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
  
              <input
                id="fecha-exacta"
                type="date"
                value={fechaExacta}
                onChange={(event) => {
                  const valor = event.target.value;
  
                  onFechaExactaChange(valor);
  
                  if (valor) {
                    onFechaDesdeChange('');
                    onFechaHastaChange('');
                  }
                }}
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-zinc-200
                  bg-white
                  pl-9
                  pr-3
                  text-sm
                  text-zinc-800
                  outline-none
                  transition
                  focus:border-zinc-400
                  focus:ring-2
                  focus:ring-zinc-100
                "
              />
            </div>
          </div>
  
          <div>
            <label
              htmlFor="fecha-desde"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              Desde
            </label>
  
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
  
              <input
                id="fecha-desde"
                type="date"
                value={fechaDesde}
                onChange={(event) => {
                  const valor = event.target.value;
  
                  onFechaDesdeChange(valor);
  
                  if (valor) {
                    onFechaExactaChange('');
                  }
                }}
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-zinc-200
                  bg-white
                  pl-9
                  pr-3
                  text-sm
                  text-zinc-800
                  outline-none
                  transition
                  focus:border-zinc-400
                  focus:ring-2
                  focus:ring-zinc-100
                "
              />
            </div>
          </div>
  
          <div>
            <label
              htmlFor="fecha-hasta"
              className="mb-1.5 block text-xs font-medium text-zinc-600"
            >
              Hasta
            </label>
  
            <div className="relative">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
  
              <input
                id="fecha-hasta"
                type="date"
                min={fechaDesde || undefined}
                value={fechaHasta}
                onChange={(event) => {
                  const valor = event.target.value;
  
                  onFechaHastaChange(valor);
  
                  if (valor) {
                    onFechaExactaChange('');
                  }
                }}
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-zinc-200
                  bg-white
                  pl-9
                  pr-3
                  text-sm
                  text-zinc-800
                  outline-none
                  transition
                  focus:border-zinc-400
                  focus:ring-2
                  focus:ring-zinc-100
                "
              />
            </div>
          </div>
        </div>
  
        {hayFiltros && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <p className="text-xs text-zinc-500">
              {cantidadResultados}{' '}
              {cantidadResultados === 1
                ? 'menú encontrado'
                : 'menús encontrados'}
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
      </section>
    );
  }
import { Search, X } from "lucide-react";

import { CATEGORIAS } from "../constants/constants";
import { formatearCategoria } from "../utils/utils";

type PlatosFiltrosProps = {
  busqueda: string;
  categoria: string;
  /** Cantidad de platos por categoría (clave "todas" = total). Opcional. */
  conteos?: Record<string, number>;
  onBusquedaChange: (valor: string) => void;
  onCategoriaChange: (valor: string) => void;
};

export default function PlatosFiltros({
  busqueda,
  categoria,
  conteos,
  onBusquedaChange,
  onCategoriaChange,
}: PlatosFiltrosProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Buscador */}
      <div className="flex h-10 items-center gap-2 rounded-[10px] border border-[#E7E4DC] bg-white px-3 transition focus-within:border-[#211F1B] focus-within:ring-2 focus-within:ring-[#211F1B]/10 lg:w-72">
        <Search size={16} className="shrink-0 text-[#6F695E]" />

        <input
          type="search"
          aria-label="Buscar plato"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar plato"
          className="w-full bg-transparent text-sm text-[#211F1B] outline-none placeholder:text-[#8A8577] [&::-webkit-search-cancel-button]:hidden"
        />

        {busqueda && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => onBusquedaChange("")}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#6F695E] hover:bg-[#EFEDE6]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Categorías */}
      <div
        role="group"
        aria-label="Filtrar por categoría"
        className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {["todas", ...CATEGORIAS].map((item) => {
          const activo = categoria === item;
          const cantidad = conteos?.[item];

          return (
            <button
              key={item}
              type="button"
              aria-pressed={activo}
              onClick={() => onCategoriaChange(item)}
              className={`flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
                activo
                  ? "border-[#211F1B] bg-[#211F1B] text-white"
                  : "border-[#E7E4DC] bg-white text-[#5F5A4F] hover:bg-[#EFEDE6]"
              }`}
            >
              {item === "todas" ? "Todas" : formatearCategoria(item)}

              {cantidad !== undefined && (
                <span
                  className={`text-xs tabular-nums ${
                    activo ? "text-white/60" : "text-[#8A8577]"
                  }`}
                >
                  {cantidad}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
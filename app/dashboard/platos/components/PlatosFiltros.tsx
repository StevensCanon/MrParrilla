import { Search } from "lucide-react";

import { CATEGORIAS } from "../constants/constants";
import { formatearCategoria } from "../utils/utils";

type PlatosFiltrosProps = {
  busqueda: string;
  categoria: string;
  onBusquedaChange: (valor: string) => void;
  onCategoriaChange: (valor: string) => void;
};

export default function PlatosFiltros({
  busqueda,
  categoria,
  onBusquedaChange,
  onCategoriaChange,
}: PlatosFiltrosProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 rounded-[10px] border border-[#E7E4DC] bg-white px-3 py-2 sm:w-72">
        <Search
          size={16}
          className="shrink-0 text-[#8A8577]"
        />

        <input
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar plato"
          className="w-full bg-transparent text-sm text-[#211F1B] outline-none placeholder:text-[#B6B1A2]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:pb-0 [&::-webkit-scrollbar]:hidden">
        {["todas", ...CATEGORIAS].map((item) => {
          const activo = categoria === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onCategoriaChange(item)}
              className={`
                shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5
                text-[13px] font-medium transition-colors
                ${
                  activo
                    ? "border-[#211F1B] bg-[#211F1B] text-white"
                    : "border-[#E7E4DC] bg-transparent text-[#8A8577] hover:bg-[#EFEDE6]"
                }
              `}
            >
              {item === "todas"
                ? "Todas"
                : formatearCategoria(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
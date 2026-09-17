import { Search } from "lucide-react";

import {
  CATEGORIAS,
} from "../constants/constants";

type InventarioFiltrosProps = {
  busqueda: string;
  categoria: string;
  onBusquedaChange: (
    valor: string,
  ) => void;
  onCategoriaChange: (
    valor: string,
  ) => void;
};

export default function InventarioFiltros({
  busqueda,
  categoria,
  onBusquedaChange,
  onCategoriaChange,
}: InventarioFiltrosProps) {
  return (
    <div className="mb-5 rounded-2xl border border-[#E4DED3] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9389]" />

          <input
            type="text"
            value={busqueda}
            onChange={(event) =>
              onBusquedaChange(
                event.target.value,
              )
            }
            placeholder="Buscar producto..."
            className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] pl-10 pr-4 text-sm text-[#201D18] outline-none transition placeholder:text-[#AAA39A] focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
          />
        </div>

        <select
          value={categoria}
          onChange={(event) =>
            onCategoriaChange(
              event.target.value,
            )
          }
          className="h-10 rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
        >
          <option value="todas">
            Todas las categorías
          </option>

          {CATEGORIAS.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
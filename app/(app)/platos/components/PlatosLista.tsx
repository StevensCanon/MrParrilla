import { Utensils } from "lucide-react";

import PlatoFila from "./PlatoFila";
import type { Plato } from "../types/types";

type PlatosListaProps = {
  platos: Plato[];
  busqueda: string;
  categoria: string;
  onEditar: (plato: Plato) => void;
  onCambiarDisponibilidad: (plato: Plato) => void;
  onEliminar: (plato: Plato) => void;
};

export default function PlatosLista({
  platos,
  busqueda,
  categoria,
  onEditar,
  onCambiarDisponibilidad,
  onEliminar,
}: PlatosListaProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E7E4DC] bg-white">
      {/* Los anchos deben coincidir con los de PlatoFila */}
      <div className="hidden items-center gap-4 border-b border-[#E7E4DC] px-5 py-3 text-[13px] font-medium text-[#6F695E] sm:flex">
        <span className="flex-1">Plato</span>
        <span className="w-32 shrink-0">Categoría</span>
        <span className="w-24 shrink-0 text-right">Precio</span>
        <span className="w-20 shrink-0 text-center">Disponible</span>
        <span className="w-10 shrink-0" />
      </div>

      {platos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <Utensils size={26} className="text-[#8A8577]" />

          <p className="text-sm font-medium text-[#211F1B]">No hay platos</p>

          <p className="text-[13px] text-[#6F695E]">
            {busqueda || categoria !== "todas"
              ? "No encontramos platos con esos filtros."
              : "Comienza agregando tu primer plato."}
          </p>
        </div>
      ) : (
        platos.map((plato) => (
          <PlatoFila
            key={plato.id}
            plato={plato}
            onEditar={onEditar}
            onCambiarDisponibilidad={onCambiarDisponibilidad}
            onEliminar={onEliminar}
          />
        ))
      )}
    </div>
  );
}
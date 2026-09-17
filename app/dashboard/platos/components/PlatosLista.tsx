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
      <div className="hidden items-center gap-4 border-b border-[#E7E4DC] px-5 py-3 text-[13px] text-[#8A8577] sm:flex">
        <span className="w-2 shrink-0" />
        <span className="flex-1">Plato</span>
        <span className="w-28 shrink-0">Categoría</span>
        <span className="w-24 shrink-0 text-right">
          Precio
        </span>
        <span className="w-16 shrink-0 text-center">
          Estado
        </span>
        <span className="w-8 shrink-0" />
      </div>

      {platos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <Utensils
            size={26}
            className="text-[#B6B1A2]"
          />

          <p className="text-sm font-medium text-[#211F1B]">
            No hay platos
          </p>

          <p className="text-[13px] text-[#8A8577]">
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
            onCambiarDisponibilidad={
              onCambiarDisponibilidad
            }
            onEliminar={onEliminar}
          />
        ))
      )}
    </div>
  );
}
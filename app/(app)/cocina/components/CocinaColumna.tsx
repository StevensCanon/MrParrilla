import {
  COLOR_ESTADO,
  CONFIGURACION_COLUMNAS,
} from "../constants/constants";

import type { ComandaCocina, EstadoItem } from "../types/types";

import CocinaComanda from "./CocinaComanda";

type CocinaColumnaProps = {
  tipo: EstadoItem;
  comandas: ComandaCocina[];
  accionando: string | null;
  onCambiarEstado: (itemId: string, estado: "preparando" | "listo") => void;
  onArchivar: (comandaId: string) => void;
};

export default function CocinaColumna({
  tipo,
  comandas,
  accionando,
  onCambiarEstado,
  onArchivar,
}: CocinaColumnaProps) {
  const configuracion = CONFIGURACION_COLUMNAS[tipo];
  const idTitulo = `columna-${tipo}`;

  return (
    <section aria-labelledby={idTitulo} className="flex min-w-0 flex-col rounded-2xl border border-[#E7E1D7] bg-white/45 p-2.5 sm:p-3">
      {/* El punto de color, el título y el conteo son toda la identidad de la columna */}
      <h2
        id={idTitulo}
        className="flex items-center gap-2 border-b border-[#E2DCD0] pb-2 text-sm font-bold text-[#22201D] sm:text-base"
      >
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: COLOR_ESTADO[tipo] }}
        />
        {configuracion.titulo}
        <span
          aria-label={`${comandas.length} comandas`}
          className="ml-auto inline-flex min-w-7 items-center justify-center rounded-full bg-white px-2 py-1 text-xs font-bold tabular-nums text-[#6F695E] shadow-sm"
        >
          {comandas.length}
        </span>
      </h2>

      {comandas.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-[#D2CBBE] py-10 text-center text-sm text-[#6F695E]">
          Sin comandas
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {comandas.map((comanda) => (
            <li key={comanda.id}>
              <CocinaComanda
                comanda={comanda}
                tipo={tipo}
                accionando={accionando}
                onCambiarEstado={onCambiarEstado}
                onArchivar={onArchivar}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

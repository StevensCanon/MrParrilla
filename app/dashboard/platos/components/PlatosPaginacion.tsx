import {
    ChevronLeft,
    ChevronRight,
  } from "lucide-react";
  
  type PlatosPaginacionProps = {
    total: number;
    paginaActual: number;
    totalPaginas: number;
    rangoInicio: number;
    rangoFin: number;
    onPaginaAnterior: () => void;
    onPaginaSiguiente: () => void;
  };
  
  export default function PlatosPaginacion({
    total,
    paginaActual,
    totalPaginas,
    rangoInicio,
    rangoFin,
    onPaginaAnterior,
    onPaginaSiguiente,
  }: PlatosPaginacionProps) {
    return (
      <div className="flex flex-col items-center justify-between gap-3 px-1 sm:flex-row">
        <p className="text-[13px] text-[#8A8577]">
          {total === 0
            ? "Sin resultados"
            : `Mostrando ${rangoInicio}–${rangoFin} de ${total} platos`}
        </p>
  
        {totalPaginas > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPaginaAnterior}
              disabled={paginaActual === 1}
              className="inline-flex size-8 items-center justify-center rounded-full border border-[#E7E4DC] text-[#211F1B] transition hover:bg-[#EFEDE6] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
  
            <span className="px-1 text-[13px] text-[#8A8577]">
              Página {paginaActual} de {totalPaginas}
            </span>
  
            <button
              type="button"
              onClick={onPaginaSiguiente}
              disabled={
                paginaActual === totalPaginas
              }
              className="inline-flex size-8 items-center justify-center rounded-full border border-[#E7E4DC] text-[#211F1B] transition hover:bg-[#EFEDE6] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }
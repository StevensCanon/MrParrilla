import {
    ChevronLeft,
    ChevronRight,
  } from "lucide-react";
  
  type InventarioPaginacionProps = {
    total: number;
    paginaActual: number;
    totalPaginas: number;
    onPaginaAnterior: () => void;
    onPaginaSiguiente: () => void;
  };
  
  export default function InventarioPaginacion({
    total,
    paginaActual,
    totalPaginas,
    onPaginaAnterior,
    onPaginaSiguiente,
  }: InventarioPaginacionProps) {
    return (
      <div className="flex items-center justify-between border-t border-[#E4DED3] px-4 py-3 sm:px-5">
        <p className="text-xs text-[#817A70]">
          {total} producto
          {total !== 1 ? "s" : ""}
        </p>
  
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={paginaActual === 1}
            onClick={onPaginaAnterior}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4DED3] text-[#5F5A53] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
  
          <span className="text-xs font-medium text-[#5F5A53]">
            {paginaActual} / {totalPaginas}
          </span>
  
          <button
            type="button"
            disabled={
              paginaActual ===
              totalPaginas
            }
            onClick={onPaginaSiguiente}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4DED3] text-[#5F5A53] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
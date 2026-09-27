import {
    ChefHat,
    RefreshCw,
  } from "lucide-react";
  
  type CocinaHeaderProps = {
    actualizando: boolean;
    onActualizar: () => void;
  };
  
  export default function CocinaHeader({
    actualizando,
    onActualizar,
  }: CocinaHeaderProps) {
    return (
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#3D8060]">
            <ChefHat className="h-6 w-6" />
          </div>
  
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Cocina
            </h1>
  
            <p className="text-sm text-gray-500">
              Gestiona y prepara las comandas del restaurante
            </p>
          </div>
        </div>
  
        <button
          type="button"
          onClick={onActualizar}
          disabled={actualizando}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              actualizando ? "animate-spin" : ""
            }`}
          />
  
          {actualizando
            ? "Actualizando..."
            : "Actualizar"}
        </button>
      </header>
    );
  }
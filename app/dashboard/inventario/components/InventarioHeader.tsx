import {
    Package,
    Plus,
  } from "lucide-react";
  
  type InventarioHeaderProps = {
    onCrear: () => void;
  };
  
  export default function InventarioHeader({
    onCrear,
  }: InventarioHeaderProps) {
    return (
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#B91C1C]" />
  
            <h1 className="text-2xl font-bold tracking-tight text-[#201D18]">
              Inventario
            </h1>
          </div>
  
          <p className="text-sm text-[#817A70]">
            Administra los productos y existencias del restaurante.
          </p>
        </div>
  
        <button
          type="button"
          onClick={onCrear}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>
    );
  }
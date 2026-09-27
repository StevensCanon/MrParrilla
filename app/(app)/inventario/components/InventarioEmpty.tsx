import { Package } from "lucide-react";

type InventarioEmptyProps = {
  filtrado: boolean;
};

export default function InventarioEmpty({
  filtrado,
}: InventarioEmptyProps) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F1EA]">
        <Package className="h-5 w-5 text-[#817A70]" />
      </div>

      <h3 className="font-semibold text-[#201D18]">
        No hay productos
      </h3>

      <p className="mt-1 text-sm text-[#817A70]">
        {filtrado
          ? "No encontramos productos con esos filtros."
          : "Agrega tu primer producto al inventario."}
      </p>
    </div>
  );
}
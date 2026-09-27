import {
    Edit,
    Trash2,
  } from "lucide-react";
  
  import type {
    Producto,
  } from "../types/types";
  
  import {
    formatoMoneda,
    obtenerCategoria,
    obtenerEstadoStock,
  } from "../utils/utils";
  
  type InventarioMobileProps = {
    productos: Producto[];
    onEditar: (
      producto: Producto,
    ) => void;
    onEliminar: (
      producto: Producto,
    ) => void;
  };
  
  export default function InventarioMobile({
    productos,
    onEditar,
    onEliminar,
  }: InventarioMobileProps) {
    return (
      <div className="divide-y divide-[#EEE9E1] md:hidden">
        {productos.map((producto) => {
          const estado =
            obtenerEstadoStock(
              Number(producto.stock),
              Number(
                producto.stock_minimo,
              ),
            );
  
          return (
            <div
              key={producto.id}
              className="p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-[#201D18]">
                    {producto.nombre}
                  </h3>
  
                  <p className="mt-1 text-xs text-[#817A70]">
                    {obtenerCategoria(
                      producto.categoria,
                    )}
                  </p>
                </div>
  
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                >
                  {estado.label}
                </span>
              </div>
  
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#FCFAF7] p-3">
                  <p className="text-xs text-[#9A9389]">
                    Stock
                  </p>
  
                  <p className="mt-1 font-semibold text-[#201D18]">
                    {producto.stock}{" "}
                    <span className="text-xs font-normal text-[#817A70]">
                      {producto.unidad}
                    </span>
                  </p>
                </div>
  
                <div className="rounded-xl bg-[#FCFAF7] p-3">
                  <p className="text-xs text-[#9A9389]">
                    Costo
                  </p>
  
                  <p className="mt-1 font-semibold text-[#201D18]">
                    {formatoMoneda(
                      Number(producto.costo),
                    )}
                  </p>
                </div>
              </div>
  
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onEditar(producto)
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E4DED3] px-3 text-xs font-semibold text-[#5F5A53] transition hover:bg-[#F8F5EF]"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </button>
  
                <button
                  type="button"
                  onClick={() =>
                    onEliminar(producto)
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
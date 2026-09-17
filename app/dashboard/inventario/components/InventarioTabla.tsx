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
  
  type InventarioTablaProps = {
    productos: Producto[];
    onEditar: (
      producto: Producto,
    ) => void;
    onEliminar: (
      producto: Producto,
    ) => void;
  };
  
  export default function InventarioTabla({
    productos,
    onEditar,
    onEliminar,
  }: InventarioTablaProps) {
    return (
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E4DED3] bg-[#FCFAF7]">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                Producto
              </th>
  
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                Categoría
              </th>
  
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                Stock
              </th>
  
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                Costo
              </th>
  
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                Estado
              </th>
  
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                Acciones
              </th>
            </tr>
          </thead>
  
          <tbody className="divide-y divide-[#EEE9E1]">
            {productos.map((producto) => {
              const estado =
                obtenerEstadoStock(
                  Number(producto.stock),
                  Number(
                    producto.stock_minimo,
                  ),
                );
  
              return (
                <tr
                  key={producto.id}
                  className="transition hover:bg-[#FCFAF7]"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#201D18]">
                      {producto.nombre}
                    </div>
  
                    <div className="mt-0.5 text-xs text-[#9A9389]">
                      Unidad: {producto.unidad}
                    </div>
                  </td>
  
                  <td className="px-5 py-4 text-sm text-[#5F5A53]">
                    {obtenerCategoria(
                      producto.categoria,
                    )}
                  </td>
  
                  <td className="px-5 py-4">
                    <span className="font-semibold text-[#201D18]">
                      {producto.stock}
                    </span>
  
                    <span className="ml-1 text-sm text-[#817A70]">
                      {producto.unidad}
                    </span>
  
                    <div className="mt-1 text-xs text-[#9A9389]">
                      Mínimo:{" "}
                      {producto.stock_minimo}
                    </div>
                  </td>
  
                  <td className="px-5 py-4 text-sm font-medium text-[#201D18]">
                    {formatoMoneda(
                      Number(producto.costo),
                    )}
                  </td>
  
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                    >
                      {estado.label}
                    </span>
                  </td>
  
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onEditar(producto)
                        }
                        title="Editar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#817A70] transition hover:bg-[#F3EEE6] hover:text-[#201D18]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
  
                      <button
                        type="button"
                        onClick={() =>
                          onEliminar(producto)
                        }
                        title="Eliminar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#817A70] transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
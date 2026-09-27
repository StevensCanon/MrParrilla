import {
    Loader2,
  } from "lucide-react";
  
  import {
    CATEGORIAS,
    UNIDADES,
  } from "../constants/constants";
  
  import type {
    FormularioProducto,
    Producto,
  } from "../types/types";
  
  type ProductoDialogProps = {
    abierto: boolean;
    guardando: boolean;
    formulario: FormularioProducto;
    productoEditando: Producto | null;
    onCerrar: () => void;
    onGuardar: () => void;
    onCampoChange: (
      campo: keyof FormularioProducto,
      valor: string,
    ) => void;
  };
  
  export default function ProductoDialog({
    abierto,
    guardando,
    formulario,
    productoEditando,
    onCerrar,
    onGuardar,
    onCampoChange,
  }: ProductoDialogProps) {
    if (!abierto) {
      return null;
    }
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
        <div
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
        >
          <div className="border-b border-[#E4DED3] px-5 py-4">
            <h2 className="text-lg font-bold text-[#201D18]">
              {productoEditando
                ? "Editar producto"
                : "Nuevo producto"}
            </h2>
  
            <p className="mt-1 text-sm text-[#817A70]">
              {productoEditando
                ? "Actualiza la información del producto."
                : "Registra un nuevo producto en el inventario."}
            </p>
          </div>
  
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onGuardar();
            }}
          >
            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                  Nombre
                </label>
  
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(event) =>
                    onCampoChange(
                      "nombre",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Carne de res"
                  disabled={guardando}
                  className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition placeholder:text-[#AAA39A] focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                />
              </div>
  
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                    Categoría
                  </label>
  
                  <select
                    value={formulario.categoria}
                    onChange={(event) =>
                      onCampoChange(
                        "categoria",
                        event.target.value,
                      )
                    }
                    disabled={guardando}
                    className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                  >
                    <option value="">
                      Sin categoría
                    </option>
  
                    {CATEGORIAS.map(
                      (categoria) => (
                        <option
                          key={categoria.value}
                          value={categoria.value}
                        >
                          {categoria.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
  
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                    Unidad
                  </label>
  
                  <select
                    value={formulario.unidad}
                    onChange={(event) =>
                      onCampoChange(
                        "unidad",
                        event.target.value,
                      )
                    }
                    disabled={guardando}
                    className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                  >
                    {UNIDADES.map(
                      (unidad) => (
                        <option
                          key={unidad.value}
                          value={unidad.value}
                        >
                          {unidad.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
  
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                    Stock actual
                  </label>
  
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulario.stock}
                    onChange={(event) =>
                      onCampoChange(
                        "stock",
                        event.target.value,
                      )
                    }
                    disabled={guardando}
                    className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                  />
                </div>
  
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                    Stock mínimo
                  </label>
  
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formulario.stock_minimo
                    }
                    onChange={(event) =>
                      onCampoChange(
                        "stock_minimo",
                        event.target.value,
                      )
                    }
                    disabled={guardando}
                    className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                  />
                </div>
              </div>
  
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                  Costo
                </label>
  
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#817A70]">
                    $
                  </span>
  
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formulario.costo}
                    onChange={(event) =>
                      onCampoChange(
                        "costo",
                        event.target.value,
                      )
                    }
                    disabled={guardando}
                    className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] pl-7 pr-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                  />
                </div>
              </div>
            </div>
  
            <div className="flex justify-end gap-2 border-t border-[#E4DED3] bg-[#FCFAF7] px-5 py-4">
              <button
                type="button"
                onClick={onCerrar}
                disabled={guardando}
                className="h-10 rounded-xl border border-[#E4DED3] bg-white px-4 text-sm font-semibold text-[#5F5A53] transition hover:bg-[#F8F5EF] disabled:opacity-50"
              >
                Cancelar
              </button>
  
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#B91C1C] px-4 text-sm font-semibold text-white transition hover:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
  
                {productoEditando
                  ? "Guardar cambios"
                  : "Crear producto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
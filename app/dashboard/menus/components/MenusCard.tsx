import { Eye, Pencil, Trash2 } from "lucide-react";

import type { Menu } from "../types/types";
import { formatearFecha, obtenerFechaColombia } from "../utils/utils";

type MenuCardProps = {
  menu: Menu;
  eliminando: boolean;
  onVer: (menu: Menu) => void;
  onEditar: (menu: Menu) => void;
  onEliminar: (menu: Menu) => void;
};

export default function MenuCard({
  menu,
  eliminando,
  onVer,
  onEditar,
  onEliminar,
}: MenuCardProps) {
  const esMenuDeHoy = menu.fecha === obtenerFechaColombia();

  const platosActivos = menu.menu_platos.filter((item) => item.activo);

  return (
    <div className="px-5 py-5 transition hover:bg-zinc-50/50 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold capitalize text-zinc-900">
              {formatearFecha(menu.fecha)}
            </h3>

            <span
              className={`
                  rounded-full
                  px-2
                  py-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wide
                  ${
                    menu.estado === "activo"
                      ? "bg-emerald-50 text-green-600"
                      : "bg-zinc-100 text-zinc-500"
                  }
                `}
            >
              {menu.estado}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {platosActivos.length === 0 ? (
              <span className="text-xs text-zinc-400">
                Sin platos configurados
              </span>
            ) : (
              platosActivos.map((menuPlato) => (
                <span
                  key={menuPlato.id}
                  className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-lg
                      border
                      border-zinc-200
                      bg-white
                      px-2.5
                      py-1.5
                      text-xs
                      font-medium
                      text-zinc-700
                    "
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />

                  {menuPlato.platos?.nombre ?? "Plato eliminado"}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onVer(menu)}
            disabled={eliminando}
            className="
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                border
                border-zinc-200
                px-3
                py-2
                text-xs
                font-medium      
                transition
             
                hover:bg-slate-800
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-50
                bg-slate-500
                text-white
                cursor-pointer
              "
          >
            <Eye size={14} />
            Ver
          </button>

          {esMenuDeHoy && (
            <button
              type="button"
              onClick={() => onEditar(menu)}
              disabled={eliminando}
              className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-lg
                  border
                  border-zinc-200
                  px-3
                  py-2
                  text-xs
                  font-medium
                  transition
                    hover:bg-blue-800
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  bg-blue-600
                  text-white
                  cursor-pointer
                "
            >
              <Pencil size={14} />
              Editar
            </button>
          )}

          <button
            type="button"
            onClick={() => onEliminar(menu)}
            disabled={eliminando}
            className="
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                px-3
                py-2
                text-xs
                font-medium
                text-white
                transition
                hover:bg-red-800
                disabled:cursor-not-allowed
                disabled:opacity-50
                bg-red-400
                cursor-pointer
                hover:text-white
              "
          >
            <Trash2 size={14} />

            {eliminando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

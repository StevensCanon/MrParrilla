import { Dialog, DialogContent } from '@/components/ui/dialog';

import type { MenuDetalle } from '../types/types';

import {
  formatearFechaCorta,
  formatearRecargo,
} from '../utils/utils';

// Mismos colores de punto que usa la pantalla de Platos.
const PUNTO_CATEGORIA: Record<string, string> = {
  desayuno: 'bg-orange-500',
  almuerzo: 'bg-blue-500',
  bebida: 'bg-green-500',
  adicional: 'bg-purple-500',
  combos: 'bg-red-500',
};

const puntoCategoria = (categoria: string) =>
  PUNTO_CATEGORIA[categoria.toLowerCase()] ?? 'bg-zinc-00';

type MenuDetalleModalProps = {
  open: boolean;
  detalle: MenuDetalle | null;
  cargando: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MenuDetalleModal({
  open,
  detalle,
  cargando,
  onOpenChange,
}: MenuDetalleModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(abierto) => {
        if (!cargando) {
          onOpenChange(abierto);
        }
      }}
    >
<DialogContent className="max-h-[90vh] overflow-hidden rounded-2xl bg-white p-0 gap-0 sm:max-w-2xl">
        {/* Encabezado */}
        <div className="border-b border-zinc-200 px-6 py-5 pr-14">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold text-zinc-900">
              {detalle
                ? `Menú del ${formatearFechaCorta(detalle.fecha)}`
                : 'Configuración del menú'}
            </h2>

            {detalle && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-700">
                <span
                  className={`size-1.5 rounded-full ${
                    detalle.estado === 'activo'
                      ? 'bg-emerald-500'
                      : 'bg-zinc-400'
                  }`}
                />
                {detalle.estado}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            Consulta los platos y opciones configuradas para este día.
          </p>
        </div>

        {/* Contenido */}
        <div className="max-h-[65vh] overflow-y-auto bg-zinc-100 px-6 py-5 [scrollbar-color:#D4D4D8_transparent] [scrollbar-width:thin]">
          {cargando ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <div className="h-4 w-40 rounded bg-zinc-200" />

                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded bg-zinc-100" />
                    <div className="h-3 w-3/4 rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : detalle ? (
            <div className="space-y-5">
              {detalle.platos.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center">
                  <p className="text-sm font-medium text-zinc-700">
                    Este menú no tiene platos configurados.
                  </p>
                </div>
              ) : (
                detalle.platos.map((menuPlato) => (
                  <section
                    key={menuPlato.id}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
                  >
                    {/* Cabecera del plato */}
                    <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold text-zinc-900">
                          {menuPlato.plato?.nombre ?? 'Plato eliminado'}
                        </h3>

                        {menuPlato.plato?.categoria && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs capitalize text-zinc-600">
                            <span
                              aria-hidden="true"
                              className={`size-1.5 rounded-full ${puntoCategoria(
                                menuPlato.plato.categoria
                              )}`}
                            />
                            {menuPlato.plato.categoria}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 text-xs text-zinc-500">
                        {menuPlato.grupos.length}{' '}
                        {menuPlato.grupos.length === 1 ? 'grupo' : 'grupos'}
                      </span>
                    </div>

                    {/* Grupos: nombre a la izquierda, opciones a la derecha */}
                    <div className="divide-y divide-zinc-100">
                      {menuPlato.grupos.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-zinc-500">
                          Este plato no tiene grupos de opciones.
                        </p>
                      ) : (
                        menuPlato.grupos.map((grupo) => (
                          <div
                            key={grupo.id}
                            className="grid gap-x-6 gap-y-2.5 px-4 py-4 sm:grid-cols-[8.5rem_1fr]"
                          >
                            <div>
                              <h4 className="text-sm font-semibold text-zinc-900">
                                {grupo.nombre}
                              </h4>

                             
                            </div>

                            {grupo.opciones.length === 0 ? (
                              <p className="text-sm text-zinc-500">
                                Sin opciones configuradas.
                              </p>
                            ) : (
                              <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                                {grupo.opciones.map((opcion) => {
                                  
                                  

                                  return (
                                    <li
                                      key={opcion.id}
                                      className="flex items-baseline justify-between gap-3 text-sm text-zinc-800"
                                    >
                                      <span className="min-w-0 truncate">
                                        {opcion.nombre}
                                      </span>

                                    
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                ))
              )}
            </div>
          ) : null}
        </div>

        {/* Pie */}
        <div className="border-t border-zinc-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={cargando}
              className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
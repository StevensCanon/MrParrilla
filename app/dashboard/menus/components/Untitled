import { Dialog, DialogContent } from '@/components/ui/dialog';

import type { MenuDetalle } from '../types/types';

import {
  formatearFechaCorta,
  formatearRecargo,
} from '../utils/utils';

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
      <DialogContent className="max-h-[90vh] overflow-hidden rounded-2xl bg-white p-0 sm:max-w-2xl">
        <div className="border-b border-zinc-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                {detalle
                  ? `Menú del ${formatearFechaCorta(
                      detalle.fecha
                    )}`
                  : 'Configuración del menú'}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Consulta los platos y opciones configuradas para este día.
              </p>
            </div>

            {detalle && (
              <span
                className={`
                  shrink-0
                  rounded-full
                  px-2
                  py-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wide
                  ${
                    detalle.estado === 'activo'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-zinc-100 text-zinc-500'
                  }
                `}
              >
                {detalle.estado}
              </span>
            )}
          </div>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          {cargando ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-xl border border-zinc-200 p-4"
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
            <div className="space-y-4">
              {detalle.platos.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-zinc-700">
                    Este menú no tiene platos configurados.
                  </p>
                </div>
              ) : (
                detalle.platos.map((menuPlato) => (
                  <div
                    key={menuPlato.id}
                    className="overflow-hidden rounded-xl border shadow-xs shadow-zinc-400"
                  >
                    <div className="border-b border-zinc-200 bg-yellow-100 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-black">
                            {menuPlato.plato?.nombre ??
                              'Plato eliminado'}
                          </h3>

                          {menuPlato.plato?.categoria && (
                            <p className="mt-0.5 text-xs capitalize text-zinc-700">
                              {menuPlato.plato.categoria}
                            </p>
                          )}
                        </div>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                          {menuPlato.grupos.length}{' '}
                          {menuPlato.grupos.length === 1
                            ? 'grupo'
                            : 'grupos'}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-zinc-100">
                      {menuPlato.grupos.length === 0 ? (
                        <div className="px-4 py-4">
                          <p className="text-xs text-zinc-400">
                            Este plato no tiene grupos de opciones.
                          </p>
                        </div>
                      ) : (
                        menuPlato.grupos.map((grupo) => (
                          <div
                            key={grupo.id}
                            className="px-4 py-4"
                          >
                            <div className="mb-3 flex items-center gap-2">
                              <h4 className="text-xs font-semibold text-zinc-800">
                                {grupo.nombre}
                              </h4>

                              {grupo.obligatorio && (
                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                                  Obligatorio
                                </span>
                              )}
                            </div>

                            {grupo.opciones.length === 0 ? (
                              <p className="text-xs text-zinc-400">
                                Sin opciones configuradas.
                              </p>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2">
                                {grupo.opciones.map(
                                  (opcion) => {
                                    const recargo =
                                      formatearRecargo(
                                        opcion.recargo
                                      );

                                    return (
                                      <div
                                        key={opcion.id}
                                        className="
                                          flex
                                          items-center
                                          justify-between
                                          gap-3
                                          rounded-lg
                                          border
                                          border-zinc-100
                                          bg-zinc-50
                                          px-3
                                          py-2.5
                                        "
                                      >
                                        <span className="min-w-0 truncate text-xs font-medium text-zinc-700">
                                          {opcion.nombre}
                                        </span>

                                        {recargo && (
                                          <span className="shrink-0 text-[11px] font-medium text-zinc-500">
                                            {recargo}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="border-t border-zinc-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={cargando}
              className="
                rounded-lg
                border
                border-zinc-200
                px-4
                py-2
                text-sm
                font-medium
                text-zinc-700
                transition
                hover:bg-zinc-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cerrar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
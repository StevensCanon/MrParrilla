"use client";

import {
  Check,
  Loader2,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import type {
  ConfiguracionPlato,
  OpcionMenu,
  OpcionSeleccionada,
  Plato,
  GrupoMenu,
} from "../types/types";

import {
  money,
} from "../utils/utils";

type ConfigurarPlatoDialogProps = {
  open: boolean;
  plato: Plato | null;
  configuracion: ConfiguracionPlato | null;
  selecciones: Record<string, OpcionSeleccionada[]>;
  observaciones: string;
  cargando: boolean;
  guardando: boolean;
  precio: number;
  onClose: () => void;
  onSeleccionar: (
    grupo: GrupoMenu,
    opcion: OpcionMenu,
  ) => void;
  onObservacionesChange: (value: string) => void;
  onConfirmar: () => void;
};

export function ConfigurarPlatoDialog({
  open,
  plato,
  configuracion,
  selecciones,
  observaciones,
  cargando,
  guardando,
  precio,
  onClose,
  onSeleccionar,
  onObservacionesChange,
  onConfirmar,
}: ConfigurarPlatoDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[650px]">
        <DialogHeader className="border-b border-[#E4DED3] px-6 py-5">
          <DialogTitle className="text-xl">
            Armar {plato?.nombre ?? "plato"}
          </DialogTitle>

          <DialogDescription>
            Selecciona las opciones que tendrá este plato.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {cargando ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <Loader2
                size={28}
                className="animate-spin text-[#8A8375]"
              />

              <p className="mt-3 text-sm font-medium text-[#22201D]">
                Cargando opciones...
              </p>

              <p className="mt-1 text-xs text-[#8A8375]">
                Consultando el menú del día.
              </p>
            </div>
          ) : !configuracion ? (
            <div className="flex min-h-[250px] items-center justify-center text-sm text-[#8A8375]">
              No hay configuración disponible.
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {configuracion.grupos.map((grupo) => {
                const seleccionadas =
                  selecciones[grupo.id] ?? [];

                const opcionesDisponibles =
                  grupo.opciones.filter(
                    (opcion) => !opcion.agotado,
                  );

                return (
                  <section key={grupo.id}>
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#22201D]">
                        {grupo.nombre}
                      </h3>

                      {grupo.obligatorio ? (
                        <span className="rounded-full bg-[#F1EEEA] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#6F695E]">
                          Obligatorio
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#F5F2ED] px-2 py-0.5 text-[9px] font-medium text-[#8A8375]">
                          Opcional
                        </span>
                      )}
                    </div>

                    {grupo.opciones.length === 0 ? (
                      <div className="rounded-md border border-[#E4DED3] bg-[#FAF8F4] px-4 py-3 text-xs text-[#8A8375]">
                        No hay opciones configuradas.
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {grupo.opciones.map(
                          (opcion) => {
                            const seleccionada =
                              seleccionadas.some(
                                (seleccion) =>
                                  seleccion.menu_opcion_id ===
                                  opcion.menu_opcion_id,
                              );

                            return (
                              <button
                                key={
                                  opcion.menu_opcion_id
                                }
                                type="button"
                                disabled={
                                  opcion.agotado
                                }
                                onClick={() =>
                                  onSeleccionar(
                                    grupo,
                                    opcion,
                                  )
                                }
                                className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition ${
                                  opcion.agotado
                                    ? "cursor-not-allowed border-[#E4DED3] bg-[#F5F2ED] opacity-50"
                                    : seleccionada
                                      ? "border-[#22201D] bg-[#F1EEEA]"
                                      : "border-[#E4DED3] bg-white hover:border-[#B8B1A4] hover:bg-[#FAF8F4]"
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                                      seleccionada
                                        ? "border-[#22201D] bg-[#22201D]"
                                        : "border-[#B8B1A4]"
                                    }`}
                                  >
                                    {seleccionada && (
                                      <Check
                                        size={11}
                                        className="text-white"
                                      />
                                    )}
                                  </span>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-[#22201D]">
                                      {opcion.nombre}
                                    </p>

                                    {opcion.agotado && (
                                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-red-600">
                                        Agotado
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {opcion.recargo > 0 && (
                                  <span className="ml-3 whitespace-nowrap font-mono text-xs text-[#6F695E]">
                                    +
                                    {money(
                                      opcion.recargo,
                                    )}
                                  </span>
                                )}
                              </button>
                            );
                          },
                        )}
                      </div>
                    )}

                    {grupo.obligatorio &&
                      opcionesDisponibles.length === 0 &&
                      grupo.opciones.length > 0 && (
                        <p className="mt-2 text-xs text-red-600">
                          Todas las opciones de este
                          grupo están agotadas.
                        </p>
                      )}
                  </section>
                );
              })}

              <div className="border-t border-[#E4DED3] pt-6">
                <label
                  htmlFor="observacionesPlato"
                  className="text-sm font-semibold text-[#22201D]"
                >
                  Observaciones
                </label>

                <p className="mt-1 text-xs text-[#8A8375]">
                  Indicaciones especiales para cocina.
                </p>

                <textarea
                  id="observacionesPlato"
                  value={observaciones}
                  onChange={(event) =>
                    onObservacionesChange(
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Sin cebolla, poco picante, bien cocido..."
                  maxLength={500}
                  rows={3}
                  className="mt-3 w-full resize-none rounded-md border border-[#E4DED3] bg-white px-3 py-2 text-sm text-[#22201D] outline-none transition placeholder:text-[#B8B1A4] focus:border-[#8A8375] focus:ring-1 focus:ring-[#8A8375]"
                />

                <div className="mt-1 text-right text-[10px] text-[#8A8375]">
                  {observaciones.length}/500
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#E4DED3] bg-[#FAF8F4] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8375]">
                Precio
              </p>

              <p className="mt-0.5 text-xs text-[#8A8375]">
                Incluye los recargos seleccionados.
              </p>
            </div>

            <p className="font-mono text-xl font-semibold text-[#22201D]">
              {money(precio)}
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-[#E4DED3] bg-white px-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={cargando || guardando}
            className="cursor-pointer"
          >
            <X size={15} />
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={onConfirmar}
            disabled={
              cargando ||
              guardando ||
              !configuracion
            }
            className="cursor-pointer bg-[#22201D] text-white hover:bg-[#3A3732]"
          >
            <Check size={15} />
            Agregar a comanda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useEffect, useState } from "react";

import {
  Check,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
  Utensils,
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
import { Input } from "@/components/ui/input";

import type {
  ItemSeleccionado,
  Mesa,
  Plato,
} from "../types/types";

import { money, obtenerNumeroMesa } from "../utils/utils";

type CategoriaPlatos = {
  value: string;
  label: string;
  platos: Plato[];
};

type ComandaDialogProps = {
  open: boolean;
  mesa: Mesa | null;
  estaOcupada: boolean;
  items: ItemSeleccionado[];
  categorias: CategoriaPlatos[];
  platosFiltrados: Plato[];
  catalogoTotal: number;
  busqueda: string;
  total: number;
  guardando: boolean;
  onClose: () => void;
  onBusquedaChange: (value: string) => void;
  onAgregarPlato: (plato: Plato) => void;
  onQuitarPlato: (platoId: string) => void;
  onIncrementar: (uid: string) => void;
  onDisminuir: (uid: string) => void;
  onEliminar: (uid: string) => void;
  onLiberarMesa: () => void;
  onConfirmar: () => void;
};

export function ComandaDialog({
  open,
  mesa,
  estaOcupada: mesaOcupada,
  items,
  categorias,
  platosFiltrados,
  catalogoTotal,
  busqueda,
  total,
  guardando,
  onClose,
  onBusquedaChange,
  onAgregarPlato,
  onQuitarPlato,
  onIncrementar,
  onDisminuir,
  onEliminar,
  onLiberarMesa,
  onConfirmar,
}: ComandaDialogProps) {
  const [vistaMovil, setVistaMovil] = useState<"catalogo" | "comanda">("catalogo");

  useEffect(() => {
    if (open) {
      setVistaMovil(items.length > 0 ? "comanda" : "catalogo");
    }
  }, [open, mesa?.id, items.length]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0 sm:h-[90vh] sm:max-h-[90vh] sm:max-w-[950px]">
        <DialogHeader className="shrink-0 border-b border-[#E4DED3] px-4 py-3 sm:px-6 sm:py-5">
          <DialogTitle className="text-xl">
            Mesa{" "}
            {mesa
              ? obtenerNumeroMesa(mesa.nombre)
              : ""}
          </DialogTitle>

          <DialogDescription>
            {mesaOcupada
              ? "Continúa agregando productos a la comanda."
              : "Selecciona los productos y confirma para enviar la comanda a cocina."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid shrink-0 grid-cols-2 gap-1 border-b border-[#E4DED3] bg-[#FAF8F4] p-2 lg:hidden">
          <button
            type="button"
            aria-pressed={vistaMovil === "catalogo"}
            onClick={() => setVistaMovil("catalogo")}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              vistaMovil === "catalogo"
                ? "bg-white text-[#22201D] shadow-sm"
                : "text-[#777166]"
            }`}
          >
            Platos ({platosFiltrados.length})
          </button>
          <button
            type="button"
            aria-pressed={vistaMovil === "comanda"}
            onClick={() => setVistaMovil("comanda")}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              vistaMovil === "comanda"
                ? "bg-white text-[#22201D] shadow-sm"
                : "text-[#777166]"
            }`}
          >
            Comanda ({items.length})
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div
            className={`${
              vistaMovil === "catalogo" ? "flex" : "hidden"
            } min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 sm:px-6 sm:py-5 lg:flex`}
          >
            <div className="mb-3 shrink-0 sm:mb-5">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8375]"
                />

                <Input
                  value={busqueda}
                  onChange={(event) =>
                    onBusquedaChange(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar plato..."
                  className="border-[#E4DED3] pl-9"
                />
              </div>
              <p className="mt-2 text-right text-[11px] text-[#8A8375]">
                {platosFiltrados.length} de {catalogoTotal} platos del catálogo
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
              <div className="flex flex-col gap-7">
              {categorias.map((categoria) => {
                if (categoria.platos.length === 0) {
                  return null;
                }

                return (
                  <section key={categoria.value}>
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6F695E]">
                        {categoria.label}
                      </h3>

                      <div className="h-px flex-1 bg-[#E4DED3]" />
                    </div>

                    <div className="grid gap-2">
                      {categoria.platos.map(
                        (plato) => {
                          const cantidad = items
                            .filter(
                              (item) =>
                                item.plato_id ===
                                plato.id,
                            )
                            .reduce(
                              (
                                acumulado,
                                item,
                              ) =>
                                acumulado +
                                item.cantidad,
                              0,
                            );

                          return (
                            <div
                              key={plato.id}
                              className="flex items-center justify-between rounded-md border border-[#E4DED3] bg-white px-3 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[#22201D]">
                                  {plato.nombre}
                                </p>

                                <p className="mt-0.5 font-mono text-xs text-[#8A8375]">
                                  {money(
                                    Number(
                                      plato.precio,
                                    ),
                                  )}
                                </p>
                                {!plato.disponible && (
                                  <p className="mt-1 text-[10px] font-medium text-[#A3402A]">
                                    No disponible
                                  </p>
                                )}
                              </div>

                              <div className="ml-4 flex items-center gap-2">
                                {cantidad > 0 && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="size-7"
                                      onClick={() =>
                                        onQuitarPlato(
                                          plato.id,
                                        )
                                      }
                                    >
                                      <Minus size={14} />
                                    </Button>

                                    <span className="w-5 text-center text-sm font-medium">
                                      {cantidad}
                                    </span>
                                  </>
                                )}

                                <Button
                                  type="button"
                                  size="icon"
                                  disabled={!plato.disponible}
                                  title={plato.disponible ? "Agregar plato" : "Plato no disponible"}
                                  className="size-7 bg-[#22201D] text-white hover:bg-[#3A3732] disabled:cursor-not-allowed disabled:bg-[#D8D0C3] disabled:text-[#8A8375]"
                                  onClick={() =>
                                    {
                                      setVistaMovil("comanda");
                                      void onAgregarPlato(plato);
                                    }
                                  }
                                >
                                  <Plus size={14} />
                                </Button>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </section>
                );
              })}

              {platosFiltrados.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <Search
                    size={28}
                    className="text-[#B8B1A4]"
                  />

                  <p className="mt-3 text-sm font-medium text-[#22201D]">
                    {catalogoTotal === 0
                      ? "El catálogo de platos está vacío"
                      : "No hay platos que coincidan"}
                  </p>

                  <p className="mt-1 text-xs text-[#8A8375]">
                    {catalogoTotal === 0
                      ? "Crea platos desde el módulo Platos para poder agregarlos a esta comanda."
                      : "Prueba con otro término de búsqueda."}
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>

          <div
            className={`${
              vistaMovil === "comanda" ? "flex" : "hidden"
            } min-h-0 w-full flex-1 flex-col border-t border-[#E4DED3] bg-[#FAF8F4] lg:flex lg:w-[350px] lg:flex-none lg:border-l lg:border-t-0`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#E4DED3] px-4 py-3 sm:px-5 sm:py-4">
              <div>
                <h3 className="text-sm font-semibold text-[#22201D]">
                  Comanda
                </h3>

                <p className="mt-0.5 text-xs text-[#8A8375]">
                  {items.length}{" "}
                  {items.length === 1
                    ? "producto"
                    : "productos"}
                </p>
              </div>

              <Utensils
                size={18}
                className="text-[#8A8375]"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4">
              {items.length === 0 ? (
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                  <Utensils
                    size={26}
                    className="text-[#B8B1A4]"
                  />

                  <p className="mt-3 text-sm font-medium text-[#22201D]">
                    Comanda vacía
                  </p>

                  <p className="mt-1 max-w-[200px] text-xs text-[#8A8375]">
                    Elige un plato en el catálogo de la izquierda. Al pulsar + debe aparecer aquí.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {items.map((item) => (
                    <div
                      key={item.uid}
                      className="border-b border-[#E4DED3] pb-3 last:border-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#22201D]">
                            {item.nombre}
                          </p>

                          <p className="mt-0.5 text-xs text-[#8A8375]">
                            {item.cantidad} ×{" "}
                            {money(item.precio)}
                          </p>
                        </div>

                        <p className="whitespace-nowrap font-mono text-sm text-[#22201D]">
                          {money(
                            item.precio *
                              item.cantidad,
                          )}
                        </p>
                      </div>

                      {item.configurado &&
                        item.opciones.length >
                          0 && (
                          <div className="mt-2 rounded-md bg-white px-3 py-2">
                            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[#8A8375]">
                              Selección
                            </p>

                            <div className="flex flex-col gap-0.5">
                              {item.opciones.map(
                                (opcion) => (
                                  <div
                                    key={`${item.uid}-${opcion.menu_opcion_id}`}
                                    className="flex items-center justify-between gap-2 text-xs"
                                  >
                                    <span className="text-[#4F4A43]">
                                      {
                                        opcion.grupo_nombre
                                      }
                                      :{" "}
                                      <strong>
                                        {
                                          opcion.nombre
                                        }
                                      </strong>
                                    </span>

                                    {opcion.recargo >
                                      0 && (
                                      <span className="font-mono text-[10px] text-[#8A8375]">
                                        +
                                        {money(
                                          opcion.recargo,
                                        )}
                                      </span>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {item.observaciones.trim() && (
                        <div className="mt-2 rounded-md border border-[#E4DED3] bg-[#FFFDF9] px-3 py-2">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8A8375]">
                            Observaciones
                          </p>

                          <p className="mt-1 text-xs text-[#4F4A43]">
                            {item.observaciones}
                          </p>
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            onDisminuir(item.uid)
                          }
                        >
                          <Minus size={13} />
                        </Button>

                        <span className="w-5 text-center text-xs">
                          {item.cantidad}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            onIncrementar(item.uid)
                          }
                        >
                          <Plus size={13} />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="ml-auto size-7 text-[#A3402A] hover:bg-[#FFF5F2]"
                          onClick={() =>
                            onEliminar(item.uid)
                          }
                          title="Eliminar producto"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-[#E4DED3] px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#6F695E]">
                  Total
                </span>

                <span className="font-mono text-lg font-semibold text-[#22201D]">
                  {money(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-[#E4DED3] bg-white px-4 py-3 sm:px-6 sm:py-4">
          {mesaOcupada && (
            <Button
              type="button"
              onClick={onLiberarMesa}
              disabled={guardando}
              variant="outline"
              className="mr-auto mb-4 cursor-pointer text-[#A3402A] hover:bg-red-500 hover:text-white sm:mr-auto"
            >
              <Trash2 size={15} />
              Liberar mesa
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={guardando}
            className="cursor-pointer"
          >
            <X size={15} />
            Cerrar
          </Button>

          <Button
            type="button"
            onClick={onConfirmar}
            disabled={
              guardando ||
              items.length === 0
            }
            className="cursor-pointer bg-[#22201D] text-white hover:bg-[#3A3732]"
          >
            {guardando ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
                Guardando...
              </>
            ) : (
              <>
                <Check size={15} />
                Confirmar comanda
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

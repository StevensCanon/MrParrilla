"use client";

import {
  Receipt,
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
  ComandaItem,
  Mesa,
  Plato,
} from "../types/types";

import {
  money,
  obtenerNumeroMesa,
} from "../utils/utils";

type DetalleMesaCajeroDialogProps = {
  open: boolean;
  mesa: Mesa | null;
  platos: Plato[];
  items: ComandaItem[];
  total: number;
  onClose: () => void;
};

export function DetalleMesaCajeroDialog({
  open,
  mesa,
  platos,
  items,
  total,
  onClose,
}: DetalleMesaCajeroDialogProps) {
  const padres = items.filter(
    (item) => item.item_padre_id === null,
  );

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
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">
                Mesa{" "}
                {mesa
                  ? obtenerNumeroMesa(mesa.nombre)
                  : ""}
              </DialogTitle>

              <DialogDescription className="mt-1">
                Detalle del consumo actual.
              </DialogDescription>
            </div>

            <div className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-medium text-white">
              Ocupada
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {padres.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
              <Receipt
                size={32}
                className="text-[#B8B1A4]"
              />

              <p className="mt-3 text-sm font-medium text-[#22201D]">
                Sin productos
              </p>

              <p className="mt-1 text-xs text-[#8A8375]">
                Esta mesa no tiene productos registrados.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#E4DED3] pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A8375]">
                <span>Producto</span>
                <span>Cant.</span>
                <span>Subtotal</span>
              </div>

              {padres.map((item) => {
                const plato = platos.find(
                  (actual) =>
                    actual.id === item.plato_id,
                );

                const subtotal =
                  Number(item.precio_unitario) *
                  Number(item.cantidad);


                return (
                  <div
                    key={item.id}
                    className="border-b border-[#E4DED3] pb-3"
                  >
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#22201D]">
                          {plato?.nombre ?? "Producto"}
                        </p>

                        <p className="mt-0.5 text-xs text-[#8A8375]">
                          {money(
                            Number(
                              item.precio_unitario,
                            ),
                          )}{" "}
                          c/u
                        </p>

                        {item.observaciones && (
                          <div className="mt-2 rounded-md border border-[#E4DED3] bg-[#FFFDF9] px-3 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8A8375]">
                              Observaciones
                            </p>

                            <p className="mt-1 text-[11px] text-[#4F4A43]">
                              {item.observaciones}
                            </p>
                          </div>
                        )}
                      </div>

                      <span className="text-sm font-medium text-[#6F695E]">
                        {item.cantidad}
                      </span>

                      <span className="whitespace-nowrap font-mono text-sm font-medium text-[#22201D]">
                        {money(subtotal)}
                      </span>
                    </div>

                 
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-[#E4DED3] bg-zinc-50 px-6 py-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-black">
                Total de la mesa
              </p>

              <p className="mt-1 text-sm font-medium text-[#6F695E]">
                Consumo actual
              </p>
            </div>

            <p className="font-mono text-2xl font-extrabold text-black">
              {money(total)}
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-[#E4DED3] bg-white px-6 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer bg-red-500 text-white hover:bg-red-900 hover:text-white"
          >
            <X size={15} />
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
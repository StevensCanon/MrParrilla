"use client";

import { Banknote, Check, Loader2, X } from "lucide-react";

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

import { money } from "../utils/utils";

type PagoEfectivoDialogProps = {
  open: boolean;
  total: number;
  montoRecibido: string;
  pagando: boolean;
  onClose: () => void;
  onMontoRecibidoChange: (value: string) => void;
  onConfirmar: () => void;
};

export function PagoEfectivoDialog({
  open,
  total,
  montoRecibido,
  pagando,
  onClose,
  onMontoRecibidoChange,
  onConfirmar,
}: PagoEfectivoDialogProps) {
  const recibido = Number(montoRecibido);
  const esMontoValido =
    Number.isFinite(recibido) && recibido > 0;
  const esSuficiente =
    esMontoValido && recibido >= total;
  const cambio =
    esSuficiente ? recibido - total : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#E8F1EC] text-[#3D8060]">
              <Banknote size={18} />
            </span>
            Pago en efectivo
          </DialogTitle>

          <DialogDescription>
            Ingresa el dinero recibido para cerrar la comanda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-lg border border-[#E4DED3] bg-[#FFFDF9] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8375]">
              Total a cobrar
            </p>

            <p className="mt-1 font-mono text-2xl font-extrabold text-[#22201D]">
              {money(total)}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="monto-recibido"
              className="text-sm font-medium text-[#22201D]"
            >
              Dinero recibido
            </label>

            <Input
              id="monto-recibido"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={montoRecibido}
              onChange={(event) =>
                onMontoRecibidoChange(event.target.value)
              }
              placeholder="Ej. 20000"
              disabled={pagando}
              autoFocus
              className="h-11 text-base"
            />
          </div>

          <div
            className={[
              "rounded-lg border px-4 py-3",
              esSuficiente
                ? "border-[#BBD5C5] bg-[#F1F8F3]"
                : "border-[#E4DED3] bg-[#F7F5F1]",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-[#6F695E]">
                Cambio
              </span>

              <span className="font-mono text-lg font-bold text-[#22201D]">
                {money(cambio)}
              </span>
            </div>

            {!esSuficiente && montoRecibido && (
              <p className="mt-1 text-xs text-[#A3402A]">
                El dinero recibido debe ser igual o mayor al total.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pagando}
            className="cursor-pointer"
          >
            <X size={15} />
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={onConfirmar}
            disabled={!esSuficiente || pagando}
            className="cursor-pointer bg-[#3D8060] text-white hover:bg-[#32694F] disabled:cursor-not-allowed"
          >
            {pagando ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Check size={15} />
                Confirmar pago
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import {
  ArrowRightLeft,
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

import { money } from "../utils/utils";

type PagoTransferenciaDialogProps = {
  open: boolean;
  total: number;
  pagando: boolean;
  onClose: () => void;
  onConfirmar: () => void;
};

export function PagoTransferenciaDialog({
  open,
  total,
  pagando,
  onClose,
  onConfirmar,
}: PagoTransferenciaDialogProps) {
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
              <ArrowRightLeft size={18} />
            </span>
            Pago por transferencia
          </DialogTitle>

          <DialogDescription>
            Confirma que la transferencia fue recibida antes de cerrar la comanda.
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

          <div className="rounded-lg border border-[#D9E5DE] bg-[#F3F8F5] px-4 py-3">
            <p className="text-sm font-medium text-[#2E6B4F]">
              Verificación manual
            </p>

            <p className="mt-1 text-xs leading-5 text-[#5E6B63]">
              Por ahora no hay integración bancaria. El cajero debe verificar
              manualmente que el dinero haya llegado.
            </p>
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
            disabled={pagando || total <= 0}
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
                Confirmar transferencia
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

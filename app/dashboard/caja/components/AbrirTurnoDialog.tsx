
"use client";

import { useEffect, useState } from "react";
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

type AbrirTurnoDialogProps = {
  open: boolean;
  abriendo: boolean;
  onClose: () => void;
  onConfirmar: (fondoInicial: number) => void;
};

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));

export function AbrirTurnoDialog({
  open,
  abriendo,
  onClose,
  onConfirmar,
}: AbrirTurnoDialogProps) {
  const [fondoInicial, setFondoInicial] = useState("");

  useEffect(() => {
    if (!open) {
      setFondoInicial("");
    }
  }, [open]);

  const valor = Number(fondoInicial);

  const esValido =
    Number.isFinite(valor) &&
    valor >= 0 &&
    fondoInicial.trim() !== "";

  const handleConfirmar = () => {
    if (!esValido || abriendo) {
      return;
    }

    onConfirmar(valor);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !abriendo) {
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

            Abrir caja
          </DialogTitle>

          <DialogDescription>
            Registra el dinero en efectivo disponible al iniciar este turno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-lg border border-[#E4DED3] bg-[#FFFDF9] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8375]">
              Fondo inicial
            </p>

            <p className="mt-1 font-mono text-2xl font-extrabold text-[#22201D]">
              {money(valor)}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#8A8375]">
              Este valor será la base para calcular el efectivo esperado al
              cerrar la caja.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="fondo-inicial"
              className="text-sm font-medium text-[#22201D]"
            >
              Dinero disponible al abrir
            </label>

            <Input
              id="fondo-inicial"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={fondoInicial}
              onChange={(event) =>
                setFondoInicial(event.target.value)
              }
              placeholder="Ej. 50000"
              disabled={abriendo}
              autoFocus
              className="h-11 text-base"
            />

            <p className="text-xs text-[#8A8375]">
              Si comienzas sin efectivo, puedes ingresar $0.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={abriendo}
            className="cursor-pointer"
          >
            <X size={15} />
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirmar}
            disabled={!esValido || abriendo}
            className="cursor-pointer bg-[#3D8060] text-white hover:bg-[#32694F] disabled:cursor-not-allowed"
          >
            {abriendo ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Abriendo...
              </>
            ) : (
              <>
                <Check size={15} />
                Abrir caja
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


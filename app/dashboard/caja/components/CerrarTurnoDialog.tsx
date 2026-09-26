"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  LockKeyhole,
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

type CerrarTurnoDialogProps = {
  open: boolean;
  cerrando: boolean;
  efectivoEsperado: number;
  onClose: () => void;
  onConfirmar: (efectivoContado: number) => void;
};

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));

export function CerrarTurnoDialog({
  open,
  cerrando,
  efectivoEsperado,
  onClose,
  onConfirmar,
}: CerrarTurnoDialogProps) {
  const [efectivoContado, setEfectivoContado] = useState("");

  useEffect(() => {
    if (!open) {
      setEfectivoContado("");
    }
  }, [open]);

  const valorContado = Number(efectivoContado);

  const esValido =
    Number.isFinite(valorContado) &&
    valorContado >= 0 &&
    efectivoContado.trim() !== "";

  const diferencia = useMemo(() => {
    if (!esValido) {
      return 0;
    }

    return valorContado - efectivoEsperado;
  }, [esValido, valorContado, efectivoEsperado]);

  const handleConfirmar = () => {
    if (!esValido || cerrando) {
      return;
    }

    onConfirmar(valorContado);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !cerrando) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#FBEDEA] text-[#A3402A]">
              <LockKeyhole size={18} />
            </span>

            Cerrar caja
          </DialogTitle>

          <DialogDescription>
            Cuenta físicamente el dinero disponible en la caja e
            ingresa el valor encontrado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Efectivo esperado */}
          <div className="rounded-xl border border-[#E4DED3] bg-[#FFFDF9] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8375]">
              Efectivo esperado
            </p>

            <p className="mt-1 font-mono text-2xl font-extrabold text-[#22201D]">
              {money(efectivoEsperado)}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#8A8375]">
              Corresponde al fondo inicial + ventas en efectivo -
              egresos registrados.
            </p>
          </div>

          {/* Efectivo contado */}
          <div className="space-y-2">
            <label
              htmlFor="efectivo-contado"
              className="text-sm font-medium text-[#22201D]"
            >
              Efectivo contado físicamente
            </label>

            <Input
              id="efectivo-contado"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={efectivoContado}
              onChange={(event) =>
                setEfectivoContado(event.target.value)
              }
              placeholder="Ej. 68500"
              disabled={cerrando}
              autoFocus
              className="h-11 text-base"
            />
          </div>

          {/* Diferencia */}
          {esValido && (
            <div
              className={[
                "rounded-xl border p-4",
                diferencia === 0
                  ? "border-[#C9DED1] bg-[#F4F9F6]"
                  : diferencia > 0
                    ? "border-[#E6D3A8] bg-[#FBF7EC]"
                    : "border-[#E8B7AA] bg-[#FBEDEA]",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8375]">
                    Diferencia
                  </p>

                  <p
                    className={[
                      "mt-1 font-mono text-xl font-extrabold",
                      diferencia === 0
                        ? "text-[#2E6B4F]"
                        : diferencia > 0
                          ? "text-[#9A7220]"
                          : "text-[#A3402A]",
                    ].join(" ")}
                  >
                    {diferencia > 0 ? "+" : ""}
                    {money(diferencia)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-[#8A8375]">
                    Contado
                  </p>

                  <p className="font-mono text-sm font-bold text-[#22201D]">
                    {money(valorContado)}
                  </p>
                </div>
              </div>

              <p className="mt-2 text-xs leading-5 text-[#8A8375]">
                {diferencia === 0
                  ? "El efectivo coincide exactamente con lo esperado."
                  : diferencia > 0
                    ? "Hay más efectivo físico del esperado."
                    : "Hay menos efectivo físico del esperado."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={cerrando}
            className="cursor-pointer border-[#D8D1C5]"
          >
            <X size={15} />
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirmar}
            disabled={!esValido || cerrando}
            className="cursor-pointer bg-[#A3402A] text-white hover:bg-[#8F3928] disabled:cursor-not-allowed"
          >
            {cerrando ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
                Cerrando...
              </>
            ) : (
              <>
                <Check size={15} />
                Cerrar caja
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { GitMerge, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Mesa } from "../types/types";

type UnirMesasDialogProps = {
  open: boolean;
  mesas: Mesa[];
  mesaPrincipalId: string;
  mesaSecundariaId: string;
  uniendo: boolean;
  onOpenChange: (open: boolean) => void;
  onPrincipalChange: (id: string) => void;
  onSecundariaChange: (id: string) => void;
  onConfirmar: () => void;
};

const nombreMesa = (mesa: Mesa) => mesa.nombre.replace(/^mesa\s*/i, "");

export function UnirMesasDialog({
  open,
  mesas,
  mesaPrincipalId,
  mesaSecundariaId,
  uniendo,
  onOpenChange,
  onPrincipalChange,
  onSecundariaChange,
  onConfirmar,
}: UnirMesasDialogProps) {
  const mesasPrincipales = mesas.filter((mesa) => !mesa.unida_a);
  const mesasSecundarias = mesas.filter(
    (mesa) =>
      !mesa.unida_a &&
      mesa.id !== mesaPrincipalId &&
      !mesas.some((otra) => otra.unida_a === mesa.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge size={19} /> Unir mesas
          </DialogTitle>
          <DialogDescription>
            La mesa principal conserva la cuenta. La otra queda identificada como parte del grupo; al pagar la cuenta, se separan automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <label className="block space-y-2 text-sm font-medium text-[#22201D]">
            Mesa principal
            <select
              value={mesaPrincipalId}
              onChange={(event) => {
                onPrincipalChange(event.target.value);
                onSecundariaChange("");
              }}
              disabled={uniendo}
              className="h-11 w-full rounded-md border border-[#D8D0C3] bg-white px-3 text-sm"
            >
              <option value="">Selecciona una mesa</option>
              {mesasPrincipales.map((mesa) => (
                <option key={mesa.id} value={mesa.id}>
                  Mesa {nombreMesa(mesa)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium text-[#22201D]">
            Mesa que se une
            <select
              value={mesaSecundariaId}
              onChange={(event) => onSecundariaChange(event.target.value)}
              disabled={uniendo}
              className="h-11 w-full rounded-md border border-[#D8D0C3] bg-white px-3 text-sm"
            >
              <option value="">Selecciona otra mesa</option>
              {mesasSecundarias.map((mesa) => (
                <option key={mesa.id} value={mesa.id}>
                  Mesa {nombreMesa(mesa)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs leading-5 text-[#777166]">
            Si ambas mesas ya tienen una cuenta, sus productos se combinarán. Las cuentas con pagos registrados deben terminarse antes de unirlas.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uniendo}>
            <X size={15} /> Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirmar}
            disabled={uniendo || !mesaPrincipalId || !mesaSecundariaId}
            className="bg-[#22201D] text-white hover:bg-[#3A3732]"
          >
            {uniendo ? <Loader2 size={15} className="animate-spin" /> : <GitMerge size={15} />}
            {uniendo ? "Uniendo..." : "Unir mesas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

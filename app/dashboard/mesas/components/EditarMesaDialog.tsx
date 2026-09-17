"use client";

import {
  Check,
  Loader2,
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

type EditarMesaDialogProps = {
  open: boolean;
  numeroMesa: string;
  guardando: boolean;
  onOpenChange: (open: boolean) => void;
  onNumeroChange: (value: string) => void;
  onGuardar: () => void;
};

export function EditarMesaDialog({
  open,
  numeroMesa,
  guardando,
  onOpenChange,
  onNumeroChange,
  onGuardar,
}: EditarMesaDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            Editar mesa
          </DialogTitle>

          <DialogDescription>
            Cambia el número de la mesa. El nombre se
            actualizará automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          <label
            htmlFor="numeroMesaEditar"
            className="text-sm font-medium"
          >
            Número de mesa
          </label>

          <Input
            id="numeroMesaEditar"
            type="number"
            min="1"
            step="1"
            value={numeroMesa}
            onChange={(event) =>
              onNumeroChange(event.target.value)
            }
            placeholder="Ej. 5"
            className="mt-2"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onGuardar();
              }
            }}
          />

          <p className="mt-2 text-xs text-[#8A8375]">
            Se guardará como{" "}
            <strong>
              Mesa {numeroMesa || "X"}
            </strong>
            .
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={onGuardar}
            disabled={guardando}
            className="bg-[#22201D] text-white hover:bg-[#3A3732]"
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
                Guardar cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import {
  Loader2,
  Plus,
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

type CrearMesaDialogProps = {
  open: boolean;
  numeroMesa: string;
  creando: boolean;
  onOpenChange: (open: boolean) => void;
  onNumeroChange: (value: string) => void;
  onCrear: () => void;
};

export function CrearMesaDialog({
  open,
  numeroMesa,
  creando,
  onOpenChange,
  onNumeroChange,
  onCrear,
}: CrearMesaDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            Nueva mesa
          </DialogTitle>

          <DialogDescription>
            Ingresa únicamente el número de la mesa.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          <label
            htmlFor="numeroMesa"
            className="text-sm font-medium"
          >
            Número de mesa
          </label>

          <Input
            id="numeroMesa"
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
                onCrear();
              }
            }}
          />

          <p className="mt-2 text-xs text-[#8A8375]">
            La mesa se guardará automáticamente como{" "}
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
            disabled={creando}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={onCrear}
            disabled={creando}
            className="bg-[#22201D] text-white hover:bg-[#3A3732]"
          >
            {creando ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
                Creando...
              </>
            ) : (
              <>
                <Plus size={15} />
                Crear mesa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
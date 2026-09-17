"use client";

import type { Dispatch, SetStateAction } from "react";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CATEGORIAS } from "../constants/constants";

import type {
  FormularioPlato,
  Plato,
} from "../types/types";

type PlatoDialogProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  platoEditando: Plato | null;
  formulario: FormularioPlato;
  setFormulario: Dispatch<SetStateAction<FormularioPlato>>;
  guardando: boolean;
  onGuardar: () => void;
};

export default function PlatoDialog({
  abierto,
  onAbiertoChange,
  platoEditando,
  formulario,
  setFormulario,
  guardando,
  onGuardar,
}: PlatoDialogProps) {
  return (
    <Dialog
      open={abierto}
      onOpenChange={onAbiertoChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {platoEditando ? "Editar plato" : "Nuevo plato"}
          </DialogTitle>

          <DialogDescription>
            {platoEditando
              ? "Modifica la información del plato."
              : "Registra un nuevo plato en el sistema."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <label
              htmlFor="nombre-plato"
              className="text-sm font-medium"
            >
              Nombre
            </label>

            <Input
              id="nombre-plato"
              value={formulario.nombre}
              onChange={(event) =>
                setFormulario((actual) => ({
                  ...actual,
                  nombre: event.target.value,
                }))
              }
              placeholder="Ej. Bandeja paisa"
              disabled={guardando}
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <label
              htmlFor="categoria-plato"
              className="text-sm font-medium"
            >
              Categoría
            </label>

            <Select
              value={formulario.categoria}
              onValueChange={(value) =>
                setFormulario((actual) => ({
                  ...actual,
                  categoria: value ?? "",
                }))
              }
              disabled={guardando}
            >
              <SelectTrigger id="categoria-plato">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>

              <SelectContent>
                {CATEGORIAS.map((categoria) => (
                  <SelectItem
                    key={categoria}
                    value={categoria}
                  >
                    {categoria
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (letra) =>
                        letra.toUpperCase()
                      )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Precio */}
          <div className="space-y-2">
            <label
              htmlFor="precio-plato"
              className="text-sm font-medium"
            >
              Precio
            </label>

            <Input
              id="precio-plato"
              type="number"
              min="0"
              step="1"
              value={formulario.precio}
              onChange={(event) =>
                setFormulario((actual) => ({
                  ...actual,
                  precio: event.target.value,
                }))
              }
              placeholder="Ej. 15000"
              disabled={guardando}
            />
          </div>

          {/* Disponibilidad */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formulario.disponible}
              onChange={(event) =>
                setFormulario((actual) => ({
                  ...actual,
                  disponible: event.target.checked,
                }))
              }
              disabled={guardando}
              className="h-4 w-4"
            />

            <span className="text-sm">
              Plato disponible
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onAbiertoChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={onGuardar}
            disabled={guardando}
          >
            {guardando
              ? "Guardando..."
              : platoEditando
                ? "Guardar cambios"
                : "Crear plato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
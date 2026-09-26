"use client";

import {  useMemo, useState } from "react";
import {
FileText,
Loader2,
Receipt,
Upload,
Wallet,
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

type RegistrarEgresoDialogProps = {
open: boolean;
registrando: boolean;
efectivoDisponible: number;
onClose: () => void;
onConfirmar: (
concepto: string,
categoria: string,
monto: number,
observacion: string,
archivo: File | null,
) => void;
};

const money = (value: number) =>
new Intl.NumberFormat("es-CO", {
style: "currency",
currency: "COP",
maximumFractionDigits: 0,
}).format(Math.round(value || 0));

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
"image/jpeg",
"image/png",
"image/webp",
"application/pdf",
];

const categorias = [
"Insumos",
"Servicios",
"Mantenimiento",
"Transporte",
"Compras",
"Otros",
];

export function RegistrarEgresoDialog({
open,
registrando,
efectivoDisponible,
onClose,
onConfirmar,
}: RegistrarEgresoDialogProps) {
const [concepto, setConcepto] = useState("");
const [categoria, setCategoria] = useState("");
const [monto, setMonto] = useState("");
const [observacion, setObservacion] = useState("");
const [archivo, setArchivo] = useState<File | null>(null);
const [errorLocal, setErrorLocal] = useState<string | null>(null);



const montoNumero = Number(monto);

const esValido = useMemo(() => {
return (
concepto.trim().length > 0 &&
categoria.trim().length > 0 &&
Number.isFinite(montoNumero) &&
montoNumero > 0 &&
montoNumero <= efectivoDisponible
);
}, [concepto, categoria, montoNumero, efectivoDisponible]);

const diferenciaDisponible = Math.max(
efectivoDisponible - (Number.isFinite(montoNumero) ? montoNumero : 0),
0,
);

const seleccionarArchivo = (
event: React.ChangeEvent<HTMLInputElement>,
) => {
const archivoSeleccionado = event.target.files?.[0] ?? null;

setErrorLocal(null);

if (!archivoSeleccionado) {
  setArchivo(null);
  return;
}

if (!TIPOS_PERMITIDOS.includes(archivoSeleccionado.type)) {
  setErrorLocal(
    "El comprobante debe ser una imagen JPG, PNG, WebP o un PDF.",
  );

  event.target.value = "";
  setArchivo(null);
  return;
}

if (archivoSeleccionado.size > MAX_FILE_SIZE) {
  setErrorLocal("El comprobante no puede superar los 5 MB.");

  event.target.value = "";
  setArchivo(null);
  return;
}

setArchivo(archivoSeleccionado);


};

const handleConfirmar = () => {
setErrorLocal(null);

if (!concepto.trim()) {
  setErrorLocal("Ingresa el concepto del egreso.");
  return;
}

if (!categoria.trim()) {
  setErrorLocal("Selecciona una categoría.");
  return;
}

if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
  setErrorLocal("Ingresa un monto válido.");
  return;
}

if (montoNumero > efectivoDisponible) {
  setErrorLocal(
    `El monto supera el efectivo disponible de ${money(
      efectivoDisponible,
    )}.`,
  );
  return;
}

if (registrando) {
  return;
}

onConfirmar(
  concepto.trim(),
  categoria.trim(),
  montoNumero,
  observacion.trim(),
  archivo,
);

};

return (
<Dialog
open={open}
onOpenChange={(value) => {
if (!value && !registrando) {
onClose();
}
}}
> <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]"> <DialogHeader> <DialogTitle className="flex items-center gap-2 text-[#22201D]"> <span className="flex size-9 items-center justify-center rounded-full bg-[#FBEDEA] text-[#A3402A]"> <Receipt size={18} /> </span>
Registrar egreso </DialogTitle>

      <DialogDescription>
        Registra una salida de efectivo correspondiente al turno actual.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-5 py-2">
      {/* Efectivo disponible */}
      <div className="rounded-xl border border-[#D8E6DD] bg-[#F4F9F6] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6E8175]">
              Efectivo disponible
            </p>

            <p className="mt-1 font-mono text-2xl font-extrabold text-[#2E6B4F]">
              {money(efectivoDisponible)}
            </p>
          </div>

          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#3D8060]">
            <Wallet size={19} />
          </div>
        </div>

        <p className="mt-2 text-xs leading-5 text-[#6E8175]">
          Es el máximo que puedes registrar como egreso en este momento.
        </p>
      </div>

      {/* Concepto */}
      <div className="space-y-2">
        <label
          htmlFor="egreso-concepto"
          className="text-sm font-medium text-[#22201D]"
        >
          Concepto
        </label>

        <Input
          id="egreso-concepto"
          value={concepto}
          onChange={(event) => setConcepto(event.target.value)}
          placeholder="Ej. Compra de verduras"
          maxLength={150}
          disabled={registrando}
          autoFocus
          className="h-11"
        />
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <label
          htmlFor="egreso-categoria"
          className="text-sm font-medium text-[#22201D]"
        >
          Categoría
        </label>

        <select
          id="egreso-categoria"
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
          disabled={registrando}
          className="h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-[#3D8060] focus:ring-2 focus:ring-[#3D8060]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecciona una categoría</option>

          {categorias.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Monto */}
      <div className="space-y-2">
        <label
          htmlFor="egreso-monto"
          className="text-sm font-medium text-[#22201D]"
        >
          Monto
        </label>

        <Input
          id="egreso-monto"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={monto}
          onChange={(event) => {
            setMonto(event.target.value);
            setErrorLocal(null);
          }}
          placeholder="Ej. 10000"
          disabled={registrando}
          className="h-11 text-base"
        />

        {Number.isFinite(montoNumero) && montoNumero > 0 && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs ${
              montoNumero > efectivoDisponible
                ? "border-[#E8B7AA] bg-[#FBEDEA] text-[#8F3928]"
                : "border-[#D8E6DD] bg-[#F4F9F6] text-[#3D8060]"
            }`}
          >
            {montoNumero > efectivoDisponible
              ? `Supera el efectivo disponible por ${money(
                  montoNumero - efectivoDisponible,
                )}.`
              : `Después del egreso quedarían ${money(
                  diferenciaDisponible,
                )} disponibles.`}
          </div>
        )}
      </div>

      {/* Observación */}
      <div className="space-y-2">
        <label
          htmlFor="egreso-observacion"
          className="text-sm font-medium text-[#22201D]"
        >
          Observación
          <span className="ml-1 text-xs font-normal text-[#8A8375]">
            (opcional)
          </span>
        </label>

        <textarea
          id="egreso-observacion"
          value={observacion}
          onChange={(event) => setObservacion(event.target.value)}
          placeholder="Información adicional sobre el egreso..."
          maxLength={500}
          disabled={registrando}
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-[#3D8060] focus:ring-2 focus:ring-[#3D8060]/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Comprobante */}
      <div className="space-y-2">
        <label
          htmlFor="egreso-comprobante"
          className="text-sm font-medium text-[#22201D]"
        >
          Comprobante
          <span className="ml-1 text-xs font-normal text-[#8A8375]">
            (opcional)
          </span>
        </label>

        <label
          htmlFor="egreso-comprobante"
          className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#D8D1C5] bg-[#FCFAF6] px-4 py-3 transition-colors ${
            registrando
              ? "cursor-not-allowed opacity-50"
              : "hover:border-[#B8B0A3] hover:bg-[#F8F5EF]"
          }`}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#8A8375]">
            <Upload size={17} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#22201D]">
              {archivo ? "Comprobante seleccionado" : "Seleccionar archivo"}
            </p>

            <p className="truncate text-xs text-[#8A8375]">
              {archivo
                ? `${archivo.name} · ${(
                    archivo.size /
                    1024 /
                    1024
                  ).toFixed(2)} MB`
                : "JPG, PNG, WebP o PDF · máximo 5 MB"}
            </p>
          </div>
        </label>

        <input
          id="egreso-comprobante"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={seleccionarArchivo}
          disabled={registrando}
          className="sr-only"
        />
      </div>

      {/* Error local */}
      {errorLocal && (
        <div className="rounded-lg border border-[#E8B7AA] bg-[#FBEDEA] px-3 py-2.5 text-sm text-[#8F3928]">
          {errorLocal}
        </div>
      )}
    </div>

    <DialogFooter className="gap-2 sm:gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={registrando}
        className="cursor-pointer border-[#D8D1C5] bg-white hover:bg-[#F1ECE4]"
      >
        <X size={15} />
        Cancelar
      </Button>

      <Button
        type="button"
        onClick={handleConfirmar}
        disabled={!esValido || registrando}
        className="cursor-pointer bg-[#A3402A] text-white hover:bg-[#8F3928] disabled:cursor-not-allowed"
      >
        {registrando ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <FileText size={15} />
            Registrar egreso
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


);
}

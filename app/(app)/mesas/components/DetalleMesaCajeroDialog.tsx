"use client";

import { Receipt, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Banknote, ArrowRightLeft } from "lucide-react";

import type { ComandaItem, CuentaPersona, Mesa, Plato } from "../types/types";

import { money, obtenerNumeroMesa } from "../utils/utils";

type DetalleMesaCajeroDialogProps = {
  open: boolean;
  mesa: Mesa | null;
  platos: Plato[];
  items: ComandaItem[];
  total: number;
  pagado: number;
  pendiente: number;
  partes: number | null;
  partesPagadas: number;
  cuentasPersonas: CuentaPersona[];
  onDividirCuenta: () => void;
  onClose: () => void;
  onPagar: () => void;
  onPagarTransferencia: () => void;
  onPagarPersona: (
    personaId: string,
    metodo: "efectivo" | "transferencia",
  ) => void;
};

export function DetalleMesaCajeroDialog({
  open,
  mesa,
  platos,
  items,
  total,
  pagado,
  pendiente,
  partes,
  partesPagadas,
  cuentasPersonas,
  onDividirCuenta,
  onClose,
  onPagar,
  onPagarTransferencia,
  onPagarPersona,
}: DetalleMesaCajeroDialogProps) {
  const padres = items.filter((item) => item.item_padre_id === null);
  const divisionAnteriorPendiente =
    partes !== null && cuentasPersonas.length === 0 && partesPagadas > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[650px]">
        <DialogHeader className="border-b border-[#E4DED3] px-6 py-5">
          <div className="flex items-center justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-xl">
                Mesa {mesa ? obtenerNumeroMesa(mesa.nombre) : ""}
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
              <Receipt size={32} className="text-[#B8B1A4]" />

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
                  (actual) => actual.id === item.plato_id,
                );

                const subtotal =
                  Number(item.precio_unitario) * Number(item.cantidad);

                return (
                  <div
                    key={item.id}
                    className="border-b border-[#E4DED3] pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#22201D]">
                          {plato?.nombre ?? "Producto"}
                        </p>

                        <p className="mt-0.5 text-xs text-[#8A8375]">
                          {money(Number(item.precio_unitario))} c/u
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

          {partes !== null && (
            <section className="mt-6 space-y-3 border-t border-[#E4DED3] pt-5">
              <div>
                <h3 className="font-semibold text-[#22201D]">
                  {divisionAnteriorPendiente
                    ? "División anterior"
                    : "Cuentas por persona"}
                </h3>
                <p className="mt-1 text-xs text-[#8A8375]">
                  {divisionAnteriorPendiente
                    ? "Termina los pagos pendientes de esta división anterior."
                    : "Cada quien paga los platos que tiene asignados."}
                </p>
              </div>
              {cuentasPersonas.length === 0 ? (
                <p className="rounded-md bg-[#FFF5F2] px-3 py-2 text-sm text-[#A3402A]">
                  {divisionAnteriorPendiente
                    ? "Esta cuenta tiene pagos de una división anterior. Termina las partes pendientes; no se puede cambiar la distribución después de registrar pagos."
                    : "Esta división anterior no tiene platos asignados. Usa Cambiar distribución antes de cobrar."}
                </p>
              ) : (
                cuentasPersonas.map((persona) => (
                  <article
                    key={persona.id}
                    className="rounded-lg border border-[#E4DED3] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-[#22201D]">
                          Persona {persona.numero}
                        </h4>
                        <ul className="mt-1 space-y-0.5 text-sm text-[#6F695E]">
                          {persona.items.map((asignacion) => {
                            const item = padres.find(
                              (actual) =>
                                actual.id === asignacion.comanda_item_id,
                            );
                            const nombre =
                              platos.find(
                                (plato) => plato.id === item?.plato_id,
                              )?.nombre ?? "Plato";
                            return (
                              <li key={asignacion.id}>
                                {asignacion.cantidad} × {nombre}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-bold text-[#22201D]">
                          {money(persona.monto_total)}
                        </p>
                        <span
                          className={`text-xs font-semibold ${persona.pagada ? "text-[#2E6B4F]" : "text-[#A3402A]"}`}
                        >
                          {persona.pagada ? "Pagada" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                    {!persona.pagada && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onPagarPersona(persona.id, "efectivo")}
                          className="bg-[#3D8060] text-white hover:bg-[#32694F]"
                        >
                          Efectivo
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onPagarPersona(persona.id, "transferencia")
                          }
                        >
                          Transferencia
                        </Button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </section>
          )}
        </div>

        <div className="border-t border-[#E4DED3] bg-zinc-50 px-6 py-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-black">
                Total de la cuenta
              </p>

              <p className="mt-1 text-sm font-medium text-[#6F695E]">
                {pagado > 0
                  ? `Pagado ${money(pagado)} · Pendiente ${money(pendiente)}`
                  : "Consumo actual"}
              </p>
              {partes !== null && (
                <p className="mt-1 text-xs font-medium text-[#3D8060]">
                  Dividida: {partesPagadas} de {partes} partes pagadas
                </p>
              )}
            </div>

            <p className="font-mono text-2xl font-extrabold text-black">
              {money(total)}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-[#E4DED3] bg-white px-6 py-6 sm:flex-row sm:items-center sm:justify-between ">
          <Button
            type="button"
            variant="outline"
            onClick={onDividirCuenta}
            disabled={padres.length === 0 || pendiente <= 0}
            className="w-full cursor-pointer sm:w-auto"
          >
            <Users size={15} />
            {partes === null ? "Dividir cuenta" : "Ver división"}
          </Button>

          {(partes === null || divisionAnteriorPendiente) && (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              {/* Botón Principal: Efectivo en Negro Sólido */}
              <Button
                type="button"
                onClick={onPagar}
                disabled={padres.length === 0 || pendiente <= 0}
                className="flex-1 sm:flex-initial cursor-pointer bg-black text-white hover:bg-black font-medium transition-all"
              >
                <Banknote size={16} className="mr-1.5" />
                {divisionAnteriorPendiente
                  ? `Cobrar parte ${partesPagadas + 1}/${partes}`
                  : "Efectivo"}
              </Button>

              {/* Botón Secundario: Transferencia en Outline suave */}
              <Button
                type="button"
                onClick={onPagarTransferencia}
                disabled={padres.length === 0 || pendiente <= 0}
                className="flex-1 sm:flex-initial cursor-pointer border border-[#E4DED3] bg-zinc-100 text-[#22201D] hover:bg-zinc-300 font-medium"
              >
                <ArrowRightLeft size={15} className="mr-1.5 text-black" />
                {divisionAnteriorPendiente
                  ? `Transferencia ${partesPagadas + 1}/${partes}`
                  : "Transferencia"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Check, Loader2, Minus, Plus, RefreshCw, Users, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  AsignacionPlatoPersona,
  ComandaItem,
  CuentaPersona,
  Plato,
} from "../types/types";
import { money } from "../utils/utils";

type DividirCuentaDialogProps = {
  open: boolean;
  total: number;
  comandaItems: ComandaItem[];
  platos: Plato[];
  cuentasPersonas: CuentaPersona[];
  divisionActiva: boolean;
  permiteReasignar: boolean;
  guardando: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurar: (
    numeroPersonas: number,
    asignaciones: AsignacionPlatoPersona[],
  ) => void;
};

export function DividirCuentaDialog({
  open,
  total,
  comandaItems,
  platos,
  cuentasPersonas,
  divisionActiva,
  permiteReasignar,
  guardando,
  onOpenChange,
  onConfigurar,
}: DividirCuentaDialogProps) {
  const [numeroPersonas, setNumeroPersonas] = useState(2);
  const [asignaciones, setAsignaciones] = useState<Record<string, number>>({});
  const [editando, setEditando] = useState(false);

  // Evita re-inicializar el formulario si open no ha cambiado de false a true
  const prevOpenRef = useRef(false);

  const itemsPadre = useMemo(
    () => comandaItems.filter((item) => item.item_padre_id === null),
    [comandaItems]
  );

  const unidades = useMemo(
    () =>
      itemsPadre.flatMap((item) =>
        Array.from({ length: Math.max(0, Math.floor(Number(item.cantidad))) }, (_, indice) => ({
          clave: `${item.id}:${indice}`,
          item,
          numeroUnidad: indice + 1,
        }))
      ),
    [itemsPadre]
  );

  useEffect(() => {
    const acabaDeAbrir = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (!acabaDeAbrir) return;

    if (divisionActiva && cuentasPersonas.length > 0) {
      setNumeroPersonas(cuentasPersonas.length);
      const asignacionesExistentes: Record<string, number> = {};
      const conteos: Record<string, number> = {};

      cuentasPersonas.forEach((persona) => {
        persona.items.forEach((asig) => {
          for (let i = 0; i < asig.cantidad; i++) {
            const indexUsado = conteos[asig.comanda_item_id] ?? 0;
            asignacionesExistentes[`${asig.comanda_item_id}:${indexUsado}`] = persona.numero;
            conteos[asig.comanda_item_id] = indexUsado + 1;
          }
        });
      });
      setAsignaciones(asignacionesExistentes);
    } else {
      setNumeroPersonas(2);
      setAsignaciones({});
      setEditando(false);
    }
  }, [open, divisionActiva, cuentasPersonas]);

  const unidadesAsignadas = unidades.filter((unidad) => asignaciones[unidad.clave] != null);
  const personasConPlatos = new Set(unidadesAsignadas.map((unidad) => asignaciones[unidad.clave]));

  const distribucionCompleta =
    numeroPersonas >= 2 &&
    numeroPersonas <= 20 &&
    numeroPersonas <= unidades.length &&
    unidadesAsignadas.length === unidades.length &&
    personasConPlatos.size === numeroPersonas;

  const seleccionarPersona = (clave: string, personaNum: number) => {
    setAsignaciones((actuales) => {
      const siguientes = { ...actuales };
      if (siguientes[clave] === personaNum) {
        delete siguientes[clave];
      } else {
        siguientes[clave] = personaNum;
      }
      return siguientes;
    });
  };

  // Ajuste sin limitar con la cantidad de platos
  const ajustarPersonas = (nuevoValor: number) => {
    const seguro = Math.min(20, Math.max(2, nuevoValor));
    setNumeroPersonas(seguro);
    setAsignaciones((actuales) =>
      Object.fromEntries(
        Object.entries(actuales).filter(([, persona]) => persona <= seguro)
      )
    );
  };

  const guardarDistribucion = () => {
    if (!distribucionCompleta) return;

    const cantidades = new Map<string, AsignacionPlatoPersona>();
    for (const unidad of unidades) {
      const personaNumero = asignaciones[unidad.clave];
      if (personaNumero == null) continue;
      const clave = `${unidad.item.id}:${personaNumero}`;
      const asignacion = cantidades.get(clave);
      if (asignacion) {
        asignacion.cantidad += 1;
      } else {
        cantidades.set(clave, {
          comanda_item_id: unidad.item.id,
          persona_numero: personaNumero,
          cantidad: 1,
        });
      }
    }

    onConfigurar(numeroPersonas, [...cantidades.values()]);
  };

  const subtotalPersona = (numero: number) =>
    unidades
      .filter((unidad) => asignaciones[unidad.clave] === numero)
      .reduce((suma, unidad) => suma + Number(unidad.item.precio_unitario), 0);

  const nombrePlato = (platoId: string) =>
    platos.find((plato) => plato.id === platoId)?.nombre ?? "Plato";

  const progresoAsignacion = unidades.length > 0 ? (unidadesAsignadas.length / unidades.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[700px]">
        {/* Header */}
        <DialogHeader className="border-b border-[#E4DED3] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4EFE6] text-[#22201D]">
              <Users size={18} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#22201D]">
                Dividir cuenta
              </DialogTitle>
              <DialogDescription className="text-xs text-[#8A8375]">
                {divisionActiva && !editando
                  ? "Consulta el desglose actual de los consumos por persona."
                  : "Asigna cada plato al comensal correspondiente."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Cuerpo */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {!divisionActiva || editando ? (
            <div className="space-y-5">
              {/* Controles de Mesa y Total */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E4DED3] bg-[#FDFCFA] p-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8375]">
                    Cantidad de personas
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 border-[#D8D0C3] bg-white text-[#22201D] hover:bg-[#F4EFE6]"
                      onClick={() => ajustarPersonas(numeroPersonas - 1)}
                      disabled={guardando || numeroPersonas <= 2}
                    >
                      <Minus size={16} />
                    </Button>
                    <div className="flex h-10 min-w-[70px] items-center justify-center rounded-md border border-[#D8D0C3] bg-white font-mono text-base font-bold text-[#22201D]">
                      {numeroPersonas}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 border-[#D8D0C3] bg-white text-[#22201D] hover:bg-[#F4EFE6]"
                      onClick={() => ajustarPersonas(numeroPersonas + 1)}
                      disabled={guardando || numeroPersonas >= 20}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col justify-end border-t border-[#E4DED3] pt-2 sm:border-t-0 sm:pt-0 sm:text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8375]">
                    Total de la mesa
                  </span>
                  <p className="font-mono text-2xl font-black text-[#22201D]">
                    {money(total)}
                  </p>
                </div>
              </div>

              {/* Advertencia si hay más personas que platos */}
              {numeroPersonas > unidades.length && (
                <div className="flex items-center gap-2 rounded-lg bg-[#FFF5F2] px-3.5 py-2.5 text-xs text-[#A3402A]">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>
                    Hay {unidades.length} plato(s) en total. Para una división individual por plato, no puede haber más personas ({numeroPersonas}) que platos.
                  </span>
                </div>
              )}

              {/* Barra de progreso de asignación */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#6F695E]">
                    Progreso: {unidadesAsignadas.length} de {unidades.length} platos asignados
                  </span>
                  <span className="font-mono font-semibold text-[#22201D]">
                    {Math.round(progresoAsignacion)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAE6DF]">
                  <div
                    className="h-full bg-[#3D8060] transition-all duration-300"
                    style={{ width: `${progresoAsignacion}%` }}
                  />
                </div>
              </div>

              {/* Lista de platos con selector rápido de persona */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A8375]">
                  Asignar platos
                </span>

                <div className="space-y-2">
                  {unidades.map((unidad) => {
                    const asignadaA = asignaciones[unidad.clave];
                    return (
                      <div
                        key={unidad.clave}
                        className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                          asignadaA
                            ? "border-[#D6E6DC] bg-[#FAFDFB]"
                            : "border-[#E4DED3] bg-white"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#22201D]">
                            {nombrePlato(unidad.item.plato_id)}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="rounded bg-[#F4EFE6] px-1.5 py-0.5 text-[10px] font-medium text-[#6F695E]">
                              U#{unidad.numeroUnidad}
                            </span>
                            <span className="font-mono text-xs font-medium text-[#8A8375]">
                              {money(Number(unidad.item.precio_unitario))}
                            </span>
                          </div>
                        </div>

                        {/* Selector de personas en formato pastilla */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Array.from({ length: numeroPersonas }, (_, idx) => {
                            const pNum = idx + 1;
                            const seleccionado = asignadaA === pNum;
                            return (
                              <button
                                key={pNum}
                                type="button"
                                disabled={guardando}
                                onClick={() => seleccionarPersona(unidad.clave, pNum)}
                                className={`h-8 min-w-[36px] rounded-md px-2 text-xs font-semibold transition-all ${
                                  seleccionado
                                    ? "bg-[#22201D] text-white shadow-sm ring-2 ring-[#22201D] ring-offset-1"
                                    : "border border-[#D8D0C3] bg-white text-[#6F695E] hover:border-[#22201D] hover:text-[#22201D]"
                                }`}
                              >
                                P{pNum}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {unidades.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[#D8D0C3] p-8 text-center text-sm text-[#8A8375]">
                      No hay productos en esta cuenta para dividir.
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen dinámico por comensal */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A8375]">
                  Resumen de distribución
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Array.from({ length: numeroPersonas }, (_, idx) => {
                    const pNum = idx + 1;
                    const count = unidades.filter((u) => asignaciones[u.clave] === pNum).length;
                    const monto = subtotalPersona(pNum);

                    return (
                      <div
                        key={pNum}
                        className={`rounded-lg border p-3 transition-colors ${
                          count === 0
                            ? "border-dashed border-[#E4DED3] bg-[#FCFBF9] text-[#A69F91]"
                            : "border-[#E4DED3] bg-white text-[#22201D]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Persona {pNum}</span>
                          <span className="text-[11px] font-medium text-[#8A8375]">
                            {count} {count === 1 ? "plato" : "platos"}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-base font-bold">
                          {money(monto)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mensaje de validación si faltan asignaciones */}
              {!distribucionCompleta && unidades.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-[#FFF8F0] p-3 text-xs text-[#995914]">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>
                    Para guardar, debes asignar todos los platos y cada comensal debe tener al menos uno asignado.
                  </span>
                </div>
              )}
            </div>
          ) : cuentasPersonas.length > 0 ? (
            /* Vista de cuentas ya divididas */
            <div className="space-y-3">
              {cuentasPersonas.map((persona) => (
                <article
                  key={persona.id}
                  className="rounded-xl border border-[#E4DED3] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2.5">
                    <span className="text-sm font-bold text-[#22201D]">Persona {persona.numero}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        persona.pagada
                          ? "bg-[#E8F1EC] text-[#2E6B4F]"
                          : "bg-[#FFF0EA] text-[#A3402A]"
                      }`}
                    >
                      {persona.pagada ? "Pagada" : "Pendiente"}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-xs text-[#6F695E]">
                    {persona.items.map((asignacion) => {
                      const item = itemsPadre.find((i) => i.id === asignacion.comanda_item_id);
                      if (!item) return null;
                      return (
                        <li key={asignacion.id} className="flex justify-between">
                          <span>{asignacion.cantidad} × {nombrePlato(item.plato_id)}</span>
                          <span className="font-mono text-[#22201D]">
                            {money(Number(item.precio_unitario) * asignacion.cantidad)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-3 flex items-center justify-between border-t border-[#F0EBE1] pt-2">
                    <span className="text-xs text-[#8A8375]">Total a pagar</span>
                    <span className="font-mono text-base font-bold text-[#22201D]">
                      {money(persona.monto_total)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-md bg-[#FFF5F2] px-4 py-3 text-sm text-[#A3402A]">
              {permiteReasignar
                ? "Esta división no tiene asignaciones por plato. Usa Cambiar distribución para repartirlos."
                : "Esta cuenta ya tiene pagos registrados. No se puede modificar la distribución."}
            </p>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-[#E4DED3] bg-white px-6 py-4">
          <div className="flex w-full items-center justify-between gap-3">
            {divisionActiva && permiteReasignar && !editando ? (
              <>
                <div />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditando(true)}
                  disabled={guardando}
                  className="gap-1.5 border-[#D8D0C3] text-[#22201D]"
                >
                  <RefreshCw size={15} />
                  Cambiar distribución
                </Button>
              </>
            ) : (!divisionActiva || editando) ? (
              <>
                {editando ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditando(false)}
                    disabled={guardando}
                    className="text-[#6F695E]"
                  >
                    Cancelar edición
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  type="button"
                  onClick={guardarDistribucion}
                  disabled={guardando || !distribucionCompleta}
                  className="gap-2 bg-[#22201D] px-5 text-white hover:bg-[#3A3732] disabled:opacity-50 mb-2"
                >
                  {guardando ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Guardar distribución
                </Button>
              </>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
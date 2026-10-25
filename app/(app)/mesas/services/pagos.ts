import { supabase } from "@/lib/supabaseClient";
import type { AsignacionPlatoPersona } from "../types/types";

export async function confirmarPagoEfectivo(
  comandaId: string,
  montoRecibido: number,
): Promise<void> {
  const { error } = await supabase.rpc("confirmar_pago_efectivo", {
    p_comanda_id: comandaId,
    p_monto_recibido: montoRecibido,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function confirmarPagoTransferencia(
  comandaId: string,
): Promise<void> {
  const { error } = await supabase.rpc("confirmar_pago_transferencia", {
    p_comanda_id: comandaId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export type ResultadoPagoParcial = {
  cerrada: boolean;
  saldoPendiente: number;
  partesPagadas: number;
  partesTotales: number;
};

export async function configurarDivisionCuenta(
  comandaId: string,
  numeroPersonas: number,
  asignaciones: AsignacionPlatoPersona[],
): Promise<void> {
  const { error } = await supabase.rpc("configurar_division_por_platos", {
    p_comanda_id: comandaId,
    p_numero_personas: numeroPersonas,
    p_asignaciones: asignaciones,
  });

  if (error) throw new Error(error.message);
}

export async function registrarPagoPersona({
  comandaId,
  personaId,
  metodo,
  montoRecibido,
}: {
  comandaId: string;
  personaId: string;
  metodo: "efectivo" | "transferencia";
  montoRecibido?: number;
}): Promise<ResultadoPagoParcial> {
  const { data, error } = await supabase.rpc("registrar_pago_persona", {
    p_comanda_id: comandaId,
    p_persona_id: personaId,
    p_metodo_pago: metodo,
    p_monto_recibido: montoRecibido ?? null,
  });

  if (error) throw new Error(error.message);

  const resultado = Array.isArray(data) ? data[0] : data;
  return {
    cerrada: Boolean(resultado?.comanda_cerrada),
    saldoPendiente: Number(resultado?.saldo_pendiente ?? 0),
    partesPagadas: Number(resultado?.personas_pagadas ?? 0),
    partesTotales: Number(resultado?.total_personas ?? 0),
  };
}

export async function registrarPagoParcial({
  comandaId,
  monto,
  metodo,
  montoRecibido,
}: {
  comandaId: string;
  monto: number;
  metodo: "efectivo" | "transferencia";
  montoRecibido?: number;
}): Promise<ResultadoPagoParcial> {
  const { data, error } = await supabase.rpc("registrar_pago_parcial", {
    p_comanda_id: comandaId,
    p_monto: monto,
    p_metodo_pago: metodo,
    p_monto_recibido: montoRecibido ?? null,
  });

  if (error) throw new Error(error.message);

  const resultado = Array.isArray(data) ? data[0] : data;
  return {
    cerrada: Boolean(resultado?.comanda_cerrada),
    saldoPendiente: Number(resultado?.saldo_pendiente ?? 0),
    partesPagadas: Number(resultado?.partes_pagadas ?? 0),
    partesTotales: Number(resultado?.partes_totales ?? 0),
  };
}

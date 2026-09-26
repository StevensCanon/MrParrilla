import { supabase } from "@/lib/supabaseClient";

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

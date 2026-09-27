import { supabase } from "@/lib/supabaseClient";
import type { Mesa } from "../types/types";
import { ordenarMesas } from "../utils/utils";

export async function crearMesa(numero: string): Promise<Mesa> {
  const numeroNormalizado = String(Number(numero.trim()));
  const nombre = `Mesa ${numeroNormalizado}`;

  const { data, error } = await supabase
    .from("mesas")
    .insert({ nombre, activa: true })
    .select("id, nombre, activa")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear la mesa.");
  }

  return data as Mesa;
}

export async function editarMesa(
  mesaId: string,
  numero: string,
): Promise<Mesa> {
  const numeroNormalizado = String(Number(numero.trim()));
  const nombre = `Mesa ${numeroNormalizado}`;

  const { data, error } = await supabase
    .from("mesas")
    .update({ nombre })
    .eq("id", mesaId)
    .select("id, nombre, activa")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo editar la mesa.");
  }

  return data as Mesa;
}

export async function eliminarMesa(mesaId: string): Promise<void> {
  const { error } = await supabase
    .from("mesas")
    .delete()
    .eq("id", mesaId);

  if (error) {
    throw new Error(error.message);
  }
}

export function ordenarListaMesas(mesas: Mesa[]): Mesa[] {
  return ordenarMesas(mesas);
}

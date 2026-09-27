import { supabase } from "@/lib/supabaseClient";
import type { Plato, FormularioPlato } from "../types/types";

export async function obtenerPlatos(): Promise<Plato[]> {
  const { data, error } = await supabase
    .from("platos")
    .select("id, nombre, categoria, precio, disponible, creado_en")
    .order("nombre", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Plato[];
}

export async function crearPlato(
  formulario: FormularioPlato,
): Promise<void> {
  const { error } = await supabase.from("platos").insert({
    nombre: formulario.nombre.trim(),
    categoria: formulario.categoria,
    precio: Number(formulario.precio),
    disponible: formulario.disponible,
  });

  if (error) {
    throw error;
  }
}

export async function actualizarPlato(
  id: string,
  formulario: FormularioPlato,
): Promise<void> {
  const { error } = await supabase
    .from("platos")
    .update({
      nombre: formulario.nombre.trim(),
      categoria: formulario.categoria,
      precio: Number(formulario.precio),
      disponible: formulario.disponible,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function actualizarDisponibilidadPlato(
  id: string,
  disponible: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("platos")
    .update({
      disponible,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function eliminarPlato(id: string): Promise<void> {
  const { error } = await supabase
    .from("platos")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
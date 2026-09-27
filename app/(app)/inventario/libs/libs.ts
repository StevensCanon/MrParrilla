import { supabase } from "@/lib/supabaseClient";

import type {
  Producto,
} from "../types/types";

export async function obtenerProductos(): Promise<
  Producto[]
> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("nombre", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Producto[];
}

export async function crearProducto(
  datos: Omit<Producto, "id" | "creado_en">,
): Promise<void> {
  const { error } = await supabase
    .from("productos")
    .insert(datos);

  if (error) {
    throw error;
  }
}

export async function actualizarProducto(
  id: string,
  datos: Omit<Producto, "id" | "creado_en">,
): Promise<void> {
  const { error } = await supabase
    .from("productos")
    .update(datos)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function eliminarProducto(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("productos")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
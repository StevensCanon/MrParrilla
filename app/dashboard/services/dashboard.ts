import { supabase } from "@/lib/supabaseClient";

export type ProductoDashboard = { id: string; nombre: string; stock: number; costo: number; stock_minimo: number };
export type TransaccionDashboard = { id: string; tipo: "ingreso" | "egreso"; monto: number; categoria: string; descripcion: string | null; fecha: string; automatica: boolean };

export async function cargarDatosDashboard() {
  const desde = new Date();
  desde.setDate(desde.getDate() - 13);
  desde.setHours(0, 0, 0, 0);
  const desdeStr = desde.toISOString().slice(0, 10);

  const [productosRes, transaccionesRes] = await Promise.all([
    supabase.from("productos").select("id, nombre, stock, costo, stock_minimo"),
    supabase.from("transacciones").select("id, tipo, monto, categoria, descripcion, fecha, automatica").gte("fecha", desdeStr).order("fecha", { ascending: false }),
  ]);

  if (productosRes.error) throw new Error(productosRes.error.message);
  if (transaccionesRes.error) throw new Error(transaccionesRes.error.message);

  return {
    productos: (productosRes.data as ProductoDashboard[]) ?? [],
    transacciones: (transaccionesRes.data as TransaccionDashboard[]) ?? [],
  };
}

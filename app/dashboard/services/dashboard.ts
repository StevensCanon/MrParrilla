import { supabase } from "@/lib/supabaseClient";

export type ProductoDashboard = {
  id: string;
  nombre: string;
  stock: number;
  costo: number;
  stock_minimo: number;
};

export type TransaccionDashboard = {
  id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  categoria: string;
  descripcion: string | null;
  fecha: string;
  automatica: boolean;
};

export type ComandaDashboard = {
  id: string;
  canal: string;
  estado: string;
  abierta_en: string;
  cerrada_en: string | null;
};

export type PagoDashboard = {
  id: string;
  comanda_id: string;
  metodo_pago: string;
  monto: number;
  creado_en: string;
  estado: string;
};

export type ComandaItemDashboard = {
  id: string;
  comanda_id: string;
  plato_id: string;
  item_padre_id: string | null;
  cantidad: number;
  precio_unitario: number;
};

export type PlatoDashboard = {
  id: string;
  nombre: string;
  categoria: string;
};

export async function cargarDatosDashboard() {
  const desde = new Date();
  desde.setDate(desde.getDate() - 13);
  desde.setHours(0, 0, 0, 0);
  const desdeStr = desde.toISOString();

  const [productosRes, transaccionesRes, comandasRes, pagosRes] =
    await Promise.all([
      supabase.from("productos").select("id, nombre, stock, costo, stock_minimo"),
      supabase
        .from("transacciones")
        .select("id, tipo, monto, categoria, descripcion, fecha, automatica")
        .gte("fecha", desdeStr)
        .order("fecha", { ascending: false }),
      supabase
        .from("comandas")
        .select("id, canal, estado, abierta_en, cerrada_en")
        .eq("estado", "cerrada")
        .gte("cerrada_en", desdeStr)
        .order("cerrada_en", { ascending: false }),
      supabase
        .from("pagos")
        .select("id, comanda_id, metodo_pago, monto, creado_en, estado")
        .eq("estado", "confirmado")
        .gte("creado_en", desdeStr)
        .order("creado_en", { ascending: false }),
    ]);

  if (productosRes.error) throw new Error(productosRes.error.message);
  if (transaccionesRes.error) throw new Error(transaccionesRes.error.message);
  if (comandasRes.error) throw new Error(comandasRes.error.message);
  if (pagosRes.error) throw new Error(pagosRes.error.message);

  const comandas = (comandasRes.data as ComandaDashboard[]) ?? [];
  const idsComandas = comandas.map((comanda) => comanda.id);

  let items: ComandaItemDashboard[] = [];

  if (idsComandas.length > 0) {
    const { data, error } = await supabase
      .from("comanda_items")
      .select("id, comanda_id, plato_id, item_padre_id, cantidad, precio_unitario")
      .in("comanda_id", idsComandas);

    if (error) throw new Error(error.message);
    items = (data as ComandaItemDashboard[]) ?? [];
  }

  const idsPlatos = [...new Set(items.map((item) => item.plato_id))];
  let platos: PlatoDashboard[] = [];

  if (idsPlatos.length > 0) {
    const { data, error } = await supabase
      .from("platos")
      .select("id, nombre, categoria")
      .in("id", idsPlatos);

    if (error) throw new Error(error.message);
    platos = (data as PlatoDashboard[]) ?? [];
  }

  return {
    productos: (productosRes.data as ProductoDashboard[]) ?? [],
    transacciones: (transaccionesRes.data as TransaccionDashboard[]) ?? [],
    comandas,
    pagos: (pagosRes.data as PagoDashboard[]) ?? [],
    items,
    platos,
  };
}

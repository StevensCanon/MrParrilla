import { useEffect, useMemo, useState } from "react";
import { cargarDatosDashboard, type ProductoDashboard, type TransaccionDashboard } from "../services/dashboard";

export type DiaFinanciero = { key: string; label: string; ingreso: number; egreso: number };
export type CategoriaVenta = { categoria: string; monto: number };

function claveFecha(fecha: string) { return fecha.slice(0, 10); }
function claveLocal(fecha: Date) { return [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, "0"), String(fecha.getDate()).padStart(2, "0")].join("-"); }
function etiquetaDia(fecha: Date) { return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }); }

export function useDashboard() {
  const [productos, setProductos] = useState<ProductoDashboard[]>([]);
  const [transacciones, setTransacciones] = useState<TransaccionDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      try {
        const datos = await cargarDatosDashboard();
        if (cancelado) return;
        setProductos(datos.productos);
        setTransacciones(datos.transacciones);
        setError(null);
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : "No se pudieron cargar los datos del dashboard.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    void cargar();
    return () => { cancelado = true; };
  }, []);

  const stats = useMemo(() => {
    let ingresos = 0; let egresos = 0; let inventario = 0;
    for (const t of transacciones) {
      const monto = Number(t.monto) || 0;
      if (t.tipo === "ingreso") ingresos += monto; else egresos += monto;
    }
    for (const p of productos) inventario += (Number(p.stock) || 0) * (Number(p.costo) || 0);
    return {
      ingresos, egresos, balance: ingresos - egresos, inventario,
      productos: productos.length,
      stockBajo: productos.filter(p => Number(p.stock) <= Number(p.stock_minimo)),
    };
  }, [productos, transacciones]);

  const ingresosEgresos = useMemo<DiaFinanciero[]>(() => {
    const inicio = new Date(); inicio.setHours(0, 0, 0, 0); inicio.setDate(inicio.getDate() - 13);
    const dias: DiaFinanciero[] = []; const mapa = new Map<string, DiaFinanciero>();
    for (let i = 0; i < 14; i++) {
      const fecha = new Date(inicio); fecha.setDate(inicio.getDate() + i);
      const dia = { key: claveLocal(fecha), label: etiquetaDia(fecha), ingreso: 0, egreso: 0 };
      dias.push(dia); mapa.set(dia.key, dia);
    }
    for (const t of transacciones) {
      const dia = mapa.get(claveFecha(t.fecha)); if (!dia) continue;
      const monto = Number(t.monto) || 0;
      if (t.tipo === "ingreso") dia.ingreso += monto; else dia.egreso += monto;
    }
    return dias;
  }, [transacciones]);

  const ventasPorCategoria = useMemo<CategoriaVenta[]>(() => {
    const mapa = new Map<string, number>();
    for (const t of transacciones) {
      if (t.tipo !== "ingreso") continue;
      const categoria = t.categoria?.trim() || "Sin categoría";
      mapa.set(categoria, (mapa.get(categoria) ?? 0) + (Number(t.monto) || 0));
    }
    return [...mapa.entries()].map(([categoria, monto]) => ({ categoria, monto })).sort((a,b) => b.monto-a.monto).slice(0, 6);
  }, [transacciones]);

  const movimientos = useMemo(() => [...transacciones].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 8), [transacciones]);

  return { loading, error, stats, ingresosEgresos, ventasPorCategoria, movimientos };
}

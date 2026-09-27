import { useEffect, useMemo, useState } from "react";
import { cargarDatosDashboard, type ComandaDashboard, type ComandaItemDashboard, type PagoDashboard, type PlatoDashboard, type ProductoDashboard, type TransaccionDashboard } from "../services/dashboard";

export type DiaFinanciero = { key: string; label: string; ingreso: number; egreso: number };
export type CategoriaVenta = { categoria: string; monto: number };
export type PlatoVendido = { nombre: string; categoria: string; cantidad: number; monto: number };
export type DiaOperativo = { key: string; label: string; ordenes: number; ventas: number };
export type HoraPico = { hora: string; ordenes: number };
export type MetodoPago = { metodo: string; monto: number; cantidad: number };
export type CanalVenta = { canal: string; monto: number; ordenes: number };

const claveFecha = (fecha: string) => fecha.slice(0, 10);
const claveLocal = (fecha: Date) => [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, "0"), String(fecha.getDate()).padStart(2, "0")].join("-");
const etiquetaDia = (fecha: Date) => fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
const normalizarMetodo = (metodo: string) => metodo.charAt(0).toUpperCase() + metodo.slice(1);
const normalizarCanal = (canal: string) => ({ restaurante: "Restaurante", domicilio: "Domicilio", whatsapp: "WhatsApp" } as Record<string, string>)[canal] ?? normalizarMetodo(canal);

export function useDashboard() {
  const [productos, setProductos] = useState<ProductoDashboard[]>([]);
  const [transacciones, setTransacciones] = useState<TransaccionDashboard[]>([]);
  const [comandas, setComandas] = useState<ComandaDashboard[]>([]);
  const [pagos, setPagos] = useState<PagoDashboard[]>([]);
  const [items, setItems] = useState<ComandaItemDashboard[]>([]);
  const [platos, setPlatos] = useState<PlatoDashboard[]>([]);
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
        setComandas(datos.comandas);
        setPagos(datos.pagos);
        setItems(datos.items);
        setPlatos(datos.platos);
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
    const ingresos = pagos.reduce((total, pago) => total + (Number(pago.monto) || 0), 0);
    const egresos = transacciones.reduce((total, t) => t.tipo === "egreso" ? total + (Number(t.monto) || 0) : total, 0);
    const inventario = productos.reduce((total, p) => total + (Number(p.stock) || 0) * (Number(p.costo) || 0), 0);
    return { ingresos, egresos, balance: ingresos - egresos, inventario, productos: productos.length, ordenes: comandas.length, ticketPromedio: comandas.length ? ingresos / comandas.length : 0, stockBajo: productos.filter((p) => Number(p.stock) <= Number(p.stock_minimo)) };
  }, [comandas, pagos, productos, transacciones]);

  const ingresosEgresos = useMemo<DiaFinanciero[]>(() => {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - 13);
    const dias: DiaFinanciero[] = [];
    const mapa = new Map<string, DiaFinanciero>();
    for (let i = 0; i < 14; i += 1) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      const dia = { key: claveLocal(fecha), label: etiquetaDia(fecha), ingreso: 0, egreso: 0 };
      dias.push(dia);
      mapa.set(dia.key, dia);
    }
    for (const pago of pagos) {
      const dia = mapa.get(claveFecha(pago.creado_en));
      if (dia) dia.ingreso += Number(pago.monto) || 0;
    }
    for (const t of transacciones) {
      if (t.tipo !== "egreso") continue;
      const dia = mapa.get(claveFecha(t.fecha));
      if (dia) dia.egreso += Number(t.monto) || 0;
    }
    return dias;
  }, [pagos, transacciones]);

  const ventasPorCategoria = useMemo<CategoriaVenta[]>(() => {
    const platoPorId = new Map(platos.map((p) => [p.id, p]));
    const mapa = new Map<string, number>();
    for (const item of items) {
      if (item.item_padre_id !== null) continue;
      const plato = platoPorId.get(item.plato_id);
      if (!plato) continue;
      const categoria = plato.categoria || "Sin categoría";
      const monto = (Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0);
      mapa.set(categoria, (mapa.get(categoria) ?? 0) + monto);
    }
    return [...mapa.entries()].map(([categoria, monto]) => ({ categoria, monto })).sort((a, b) => b.monto - a.monto);
  }, [items, platos]);

  const platosMasVendidos = useMemo<PlatoVendido[]>(() => {
    const platoPorId = new Map(platos.map((p) => [p.id, p]));
    const mapa = new Map<string, PlatoVendido>();
    for (const item of items) {
      if (item.item_padre_id !== null) continue;
      const plato = platoPorId.get(item.plato_id);
      if (!plato) continue;
      const cantidad = Number(item.cantidad) || 0;
      const monto = cantidad * (Number(item.precio_unitario) || 0);
      const actual = mapa.get(item.plato_id);
      if (actual) {
        actual.cantidad += cantidad;
        actual.monto += monto;
      } else {
        mapa.set(item.plato_id, { nombre: plato.nombre, categoria: plato.categoria, cantidad, monto });
      }
    }
    return [...mapa.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 6);
  }, [items, platos]);

  const ordenesPorDia = useMemo<DiaOperativo[]>(() => {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - 13);
    const dias: DiaOperativo[] = [];
    const mapa = new Map<string, DiaOperativo>();
    const pagoPorComanda = new Map<string, number>();
    for (const pago of pagos) pagoPorComanda.set(pago.comanda_id, (pagoPorComanda.get(pago.comanda_id) ?? 0) + (Number(pago.monto) || 0));
    for (let i = 0; i < 14; i += 1) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      const dia = { key: claveLocal(fecha), label: etiquetaDia(fecha), ordenes: 0, ventas: 0 };
      dias.push(dia);
      mapa.set(dia.key, dia);
    }
    for (const comanda of comandas) {
      if (!comanda.cerrada_en) continue;
      const dia = mapa.get(claveFecha(comanda.cerrada_en));
      if (!dia) continue;
      dia.ordenes += 1;
      dia.ventas += pagoPorComanda.get(comanda.id) ?? 0;
    }
    return dias;
  }, [comandas, pagos]);

  const horasPico = useMemo<HoraPico[]>(() => {
    const mapa = new Map<number, number>();
    for (const comanda of comandas) {
      const hora = new Date(comanda.abierta_en).getHours();
      mapa.set(hora, (mapa.get(hora) ?? 0) + 1);
    }
    return Array.from({ length: 24 }, (_, hora) => ({
      hora: String(hora).padStart(2, "0") + ":00",
      ordenes: mapa.get(hora) ?? 0,
    })).filter((item) => item.ordenes > 0);
  }, [comandas]);

  const metodosPago = useMemo<MetodoPago[]>(() => {
    const mapa = new Map<string, MetodoPago>();
    for (const pago of pagos) {
      const metodo = normalizarMetodo(pago.metodo_pago);
      const actual = mapa.get(metodo);
      if (actual) {
        actual.monto += Number(pago.monto) || 0;
        actual.cantidad += 1;
      } else mapa.set(metodo, { metodo, monto: Number(pago.monto) || 0, cantidad: 1 });
    }
    return [...mapa.values()].sort((a, b) => b.monto - a.monto);
  }, [pagos]);

  const ventasPorCanal = useMemo<CanalVenta[]>(() => {
    const comandaPorId = new Map(comandas.map((c) => [c.id, c]));
    const mapa = new Map<string, CanalVenta>();
    for (const pago of pagos) {
      const comanda = comandaPorId.get(pago.comanda_id);
      if (!comanda) continue;
      const canal = normalizarCanal(comanda.canal);
      const monto = Number(pago.monto) || 0;
      const actual = mapa.get(canal);
      if (actual) { actual.monto += monto; actual.ordenes += 1; }
      else mapa.set(canal, { canal, monto, ordenes: 1 });
    }
    return [...mapa.values()].sort((a, b) => b.monto - a.monto);
  }, [comandas, pagos]);

  const movimientos = useMemo(() => transacciones
    .filter((t) => t.tipo === "egreso")
    .map((t) => ({ id: t.id, tipo: t.tipo, monto: Number(t.monto) || 0, categoria: t.categoria, descripcion: t.descripcion, fecha: t.fecha, automatica: t.automatica }))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 8), [transacciones]);

  return { loading, error, stats, ingresosEgresos, ventasPorCategoria, platosMasVendidos, ordenesPorDia, horasPico, metodosPago, ventasPorCanal, movimientos };
}

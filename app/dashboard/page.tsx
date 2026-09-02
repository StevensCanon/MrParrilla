"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Boxes,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";

type Producto = {
  id: string;
  nombre: string;
  stock: number;
  costo: number;
  stock_minimo: number;
};

type Transaccion = {
  id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  categoria: string;
  descripcion: string | null;
  fecha: string;
  automatica: boolean;
};

const money = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "default" | "good" | "bad" | "warn";
  sub?: string;
}) {
  const tones = {
    default: "text-[#22201D]",
    good: "text-[#2E6B4F]",
    bad: "text-[#A3402A]",
    warn: "text-[#B5842C]",
  };

  return (
    <div className="flex flex-col gap-1 rounded-sm border border-[#E4DED3] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8375]">
          {label}
        </span>

        <Icon size={16} className="text-[#8A8375]" />
      </div>

      <span className={`font-mono text-2xl font-bold ${tones[tone]}`}>
        {value}
      </span>

      {sub && <span className="text-xs text-[#8A8375]">{sub}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const desde = new Date();
        desde.setDate(desde.getDate() - 14);

        const desdeStr = desde.toISOString().slice(0, 10);

        const [productosRes, transaccionesRes] = await Promise.all([
          supabase
            .from("productos")
            .select("id, nombre, stock, costo, stock_minimo"),

          supabase
            .from("transacciones")
            .select(
              "id, tipo, monto, categoria, descripcion, fecha, automatica",
            )
            .gte("fecha", desdeStr)
            .order("fecha", { ascending: false }),
        ]);

        if (productosRes.error) {
          throw productosRes.error;
        }

        if (transaccionesRes.error) {
          throw transaccionesRes.error;
        }

        if (cancelado) {
          return;
        }

        setProductos((productosRes.data as Producto[]) ?? []);
        setTransacciones((transaccionesRes.data as Transaccion[]) ?? []);
        setError(null);
      } catch (err) {
        if (cancelado) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los datos del dashboard.",
        );
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    };

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [router]);

  const totals = useMemo(() => {
    const ingresos = transacciones
      .filter((t) => t.tipo === "ingreso")
      .reduce((s, t) => s + Number(t.monto), 0);

    const egresos = transacciones
      .filter((t) => t.tipo === "egreso")
      .reduce((s, t) => s + Number(t.monto), 0);

    const inventoryValue = productos.reduce(
      (s, p) => s + p.stock * p.costo,
      0,
    );

    const lowStock = productos.filter(
      (p) => p.stock <= p.stock_minimo,
    );

    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      inventoryValue,
      lowStock,
    };
  }, [productos, transacciones]);

  const chartData = useMemo(() => {
    const days: {
      key: string;
      label: string;
      ingreso: number;
      egreso: number;
    }[] = [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const key = date.toISOString().slice(0, 10);

      days.push({
        key,
        label: date.toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "2-digit",
        }),
        ingreso: 0,
        egreso: 0,
      });
    }

    const map = Object.fromEntries(days.map((day) => [day.key, day]));

    transacciones.forEach((transaccion) => {
      const day = map[transaccion.fecha];

      if (!day) {
        return;
      }

      if (transaccion.tipo === "ingreso") {
        day.ingreso += Number(transaccion.monto);
      } else {
        day.egreso += Number(transaccion.monto);
      }
    });

    return days;
  }, [transacciones]);

  const recientes = useMemo(
    () =>
      [...transacciones]
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .slice(0, 8),
    [transacciones],
  );

  if (loading) {
    return (
      <div className="p-8 text-sm font-mono text-[#8A8375]">
        Cargando datos del restaurante…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-sm text-[#A3402A]">
        No se pudieron cargar los datos: {error}
        <br />
        Verifica que hayas iniciado sesión con un usuario que tenga rol admin
        o cajero.
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 p-6">
      <h1 className="text-xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard
          icon={TrendingUp}
          label="Ingresos (14 días)"
          value={money(totals.ingresos)}
          tone="good"
        />

        <StatCard
          icon={TrendingDown}
          label="Egresos (14 días)"
          value={money(totals.egresos)}
          tone="bad"
        />

        <StatCard
          icon={Wallet}
          label="Balance"
          value={money(totals.balance)}
          tone={totals.balance >= 0 ? "good" : "bad"}
        />

        <StatCard
          icon={Boxes}
          label="Valor inventario"
          value={money(totals.inventoryValue)}
        />

        <StatCard
          icon={AlertTriangle}
          label="Stock bajo"
          value={totals.lowStock.length}
          tone={totals.lowStock.length ? "warn" : "default"}
          sub={
            totals.lowStock.length
              ? totals.lowStock.map((p) => p.nombre).join(", ")
              : "Todo en orden"
          }
        />
      </div>

      <div className="rounded-sm border border-[#E4DED3] bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base">
          Ingresos vs. egresos — últimos 14 días
        </h3>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E4DED3"
            />

            <XAxis
              dataKey="label"
              tick={{
                fontSize: 11,
                fill: "#8A8375",
              }}
            />

            <YAxis
              tick={{
                fontSize: 11,
                fill: "#8A8375",
              }}
              width={40}
            />

            <Tooltip
              formatter={(value) => money(Number(value ?? 0))}
              contentStyle={{
                fontSize: 12,
                borderRadius: 2,
              }}
            />

            <Bar
              dataKey="ingreso"
              fill="#2E6B4F"
              radius={[2, 2, 0, 0]}
            />

            <Bar
              dataKey="egreso"
              fill="#A3402A"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-sm border border-[#E4DED3] bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base">Movimientos recientes</h3>

        {recientes.length === 0 ? (
          <p className="text-sm text-[#8A8375]">
            Aún no hay transacciones registradas.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[#EFEAE0]">
            {recientes.map((transaccion) => (
              <div
                key={transaccion.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span>
                    {transaccion.descripcion || transaccion.categoria}
                  </span>

                  <span className="text-xs text-[#8A8375]">
                    {transaccion.categoria} · {transaccion.fecha}{" "}
                    {transaccion.automatica &&
                      "· generado automáticamente"}
                  </span>
                </div>

                <span
                  className={`font-mono font-semibold ${
                    transaccion.tipo === "ingreso"
                      ? "text-[#2E6B4F]"
                      : "text-[#A3402A]"
                  }`}
                >
                  {transaccion.tipo === "ingreso" ? "+" : "-"}
                  {money(transaccion.monto)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}


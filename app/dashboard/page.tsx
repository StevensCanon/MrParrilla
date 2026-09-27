
"use client"

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Loader2,
  Package,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/lib/supabaseClient";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

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

type ChartDay = {
  key: string;
  label: string;
  ingreso: number;
  egreso: number;
};

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const chartConfig = {
  ingreso: {
    label: "Ingresos",
    color: "#2E6B4F",
  },
  egreso: {
    label: "Egresos",
    color: "#A3402A",
  },
} satisfies ChartConfig;

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));

const number = (value: number) =>
  new Intl.NumberFormat("es-CO").format(
    Math.round(value || 0),
  );

function obtenerClaveFecha(fecha: string) {
  return fecha.slice(0, 10);
}

function formatearFecha(fecha: string) {
  const fechaLocal = new Date(fecha);

  if (Number.isNaN(fechaLocal.getTime())) {
    return fecha;
  }

  return fechaLocal.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatearFechaCorta(fecha: Date) {
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}

function obtenerInicioPeriodo() {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() - 13);

  return fecha;
}

/* -------------------------------------------------------------------------- */
/*                              Metric Card                                   */
/* -------------------------------------------------------------------------- */

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  valueClassName,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Wallet;
  iconClassName?: string;
  valueClassName?: string;
}) {
  return (
    <Card className="border-[#E8E2D8] bg-white shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#8A8375]">
              {title}
            </p>

            <p
              className={`mt-2 text-2xl font-bold tracking-tight ${valueClassName ?? "text-[#22201D]"}`}
            >
              {value}
            </p>

            <p className="mt-1 text-xs text-[#9B9488]">
              {description}
            </p>
          </div>

          <div
            className={`flex size-10 items-center justify-center rounded-xl ${iconClassName ?? "bg-[#F3F1EC] text-[#6F695E]"}`}
          >
            <Icon size={18} strokeWidth={1.8} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Loading State                                */
/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-[#EAE5DC]" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-[#F0ECE5]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-white"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-[390px] animate-pulse rounded-2xl bg-white" />
        <div className="h-[390px] animate-pulse rounded-2xl bg-white" />
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Dashboard                                 */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [transacciones, setTransacciones] = useState<
    Transaccion[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------- Data load ------------------------------ */

  useEffect(() => {
    let cancelado = false;

    const cargarDashboard = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const desde = new Date();
        desde.setDate(desde.getDate() - 13);

        const desdeStr = desde.toISOString().slice(0, 10);

        const [productosRes, transaccionesRes] =
          await Promise.all([
            supabase
              .from("productos")
              .select(
                "id, nombre, stock, costo, stock_minimo",
              ),

            supabase
              .from("transacciones")
              .select(
                "id, tipo, monto, categoria, descripcion, fecha, automatica",
              )
              .gte("fecha", desdeStr)
              .order("fecha", {
                ascending: false,
              }),
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

        setProductos(
          (productosRes.data as Producto[]) ?? [],
        );

        setTransacciones(
          (transaccionesRes.data as Transaccion[]) ?? [],
        );

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

    void cargarDashboard();

    return () => {
      cancelado = true;
    };
  }, [router]);

  /* ------------------------------- Totals -------------------------------- */

  const totals = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;
    let inventoryValue = 0;

    for (const transaccion of transacciones) {
      const monto = Number(transaccion.monto);

      if (transaccion.tipo === "ingreso") {
        ingresos += monto;
      } else {
        egresos += monto;
      }
    }

    for (const producto of productos) {
      inventoryValue +=
        Number(producto.stock) *
        Number(producto.costo);
    }

    const lowStock = productos.filter(
      (producto) =>
        Number(producto.stock) <=
        Number(producto.stock_minimo),
    );

    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      inventoryValue,
      lowStock,
    };
  }, [productos, transacciones]);

  /* ------------------------------- Chart --------------------------------- */

  const chartData = useMemo<ChartDay[]>(() => {
    const inicio = obtenerInicioPeriodo();

    const dias: ChartDay[] = [];

    for (let i = 0; i < 14; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);

      const key = [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, "0"),
        String(fecha.getDate()).padStart(2, "0"),
      ].join("-");

      dias.push({
        key,
        label: formatearFechaCorta(fecha),
        ingreso: 0,
        egreso: 0,
      });
    }

    const mapaDias = new Map(
      dias.map((dia) => [dia.key, dia]),
    );

    for (const transaccion of transacciones) {
      /*
       * Supabase puede devolver fecha como:
       *
       * 2026-09-26
       *
       * o:
       *
       * 2026-09-26T14:35:00+00:00
       *
       * Por eso solamente utilizamos YYYY-MM-DD.
       */
      const key = obtenerClaveFecha(
        transaccion.fecha,
      );

      const dia = mapaDias.get(key);

      if (!dia) {
        continue;
      }

      const monto = Number(transaccion.monto) || 0;

      if (transaccion.tipo === "ingreso") {
        dia.ingreso += monto;
      } else {
        dia.egreso += monto;
      }
    }

    return dias;
  }, [transacciones]);

  /* -------------------------- Recent movements --------------------------- */

  const recientes = useMemo(() => {
    return [...transacciones]
      .sort(
        (a, b) =>
          new Date(b.fecha).getTime() -
          new Date(a.fecha).getTime(),
      )
      .slice(0, 7);
  }, [transacciones]);

  /* ------------------------------ Render --------------------------------- */

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center p-6">
        <Card className="w-full max-w-lg border-[#E8D5D0] bg-[#FFF9F7] shadow-none">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F8E2DD] text-[#A3402A]">
                <AlertTriangle size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-[#54241D]">
                  No se pudo cargar el dashboard
                </h2>

                <p className="mt-1 text-sm leading-relaxed text-[#8A5349]">
                  {error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6 lg:p-8">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#A3402A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A3402A]" />
            Resumen del restaurante
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#22201D] md:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-[#8A8375]">
            Una vista rápida del estado financiero e
            inventario.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8A8375]">
          <CalendarDays size={15} />

          <span>
            Últimos 14 días
          </span>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Financial summary                                                  */}
      {/* ------------------------------------------------------------------ */}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden border-[#E8E2D8] bg-[#22201D] text-white shadow-none md:col-span-2 xl:col-span-1">
          <CardContent className="relative p-5">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/[0.04]" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-white/55">
                  Balance
                </span>

                <div className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <Wallet size={17} />
                </div>
              </div>

              <p
                className={`mt-4 text-2xl font-bold tracking-tight ${
                  totals.balance >= 0
                    ? "text-[#A8D5BC]"
                    : "text-[#F1A99A]"
                }`}
              >
                {money(totals.balance)}
              </p>

              <p className="mt-1 text-xs text-white/45">
                Ingresos menos egresos
              </p>
            </div>
          </CardContent>
        </Card>

        <MetricCard
          title="Ingresos"
          value={money(totals.ingresos)}
          description="Entradas registradas"
          icon={ArrowUpRight}
          iconClassName="bg-[#E8F1EC] text-[#2E6B4F]"
          valueClassName="text-[#2E6B4F]"
        />

        <MetricCard
          title="Egresos"
          value={money(totals.egresos)}
          description="Salidas registradas"
          icon={ArrowDownRight}
          iconClassName="bg-[#F7E9E5] text-[#A3402A]"
          valueClassName="text-[#A3402A]"
        />

        <MetricCard
          title="Valor inventario"
          value={money(totals.inventoryValue)}
          description={`${number(productos.length)} productos registrados`}
          icon={Boxes}
          iconClassName="bg-[#F1F0ED] text-[#6F695E]"
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Chart + inventory alerts                                           */}
      {/* ------------------------------------------------------------------ */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Chart */}
        <Card className="border-[#E8E2D8] bg-white shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-[#F0ECE5] px-5 py-5">
            <div>
              <CardTitle className="text-base font-semibold text-[#22201D]">
                Movimiento financiero
              </CardTitle>

              <p className="mt-1 text-xs text-[#918A7E]">
                Comparación diaria de ingresos y egresos
              </p>
            </div>

            <div className="hidden items-center gap-4 sm:flex">
              <div className="flex items-center gap-1.5 text-xs text-[#6F695E]">
                <span className="size-2 rounded-full bg-[#2E6B4F]" />
                Ingresos
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#6F695E]">
                <span className="size-2 rounded-full bg-[#A3402A]" />
                Egresos
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-2 pb-4 pt-5 sm:px-5">
            <ChartContainer
              config={chartConfig}
              className="h-[310px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  left: -15,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#ECE7DE"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{
                    fill: "#928B7F",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={58}
                  tick={{
                    fill: "#928B7F",
                    fontSize: 10,
                  }}
                  tickFormatter={(value) => {
                    const numero = Number(value);

                    if (numero >= 1000000) {
                      return `${Math.round(
                        numero / 1000000,
                      )}M`;
                    }

                    if (numero >= 1000) {
                      return `${Math.round(
                        numero / 1000,
                      )}K`;
                    }

                    return String(numero);
                  }}
                />

                <ChartTooltip
                  cursor={{
                    fill: "#F6F3EE",
                  }}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex min-w-[140px] items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {name === "ingreso"
                              ? "Ingresos"
                              : "Egresos"}
                          </span>

                          <span className="font-mono font-medium">
                            {money(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />

                <Bar
                  dataKey="ingreso"
                  fill="var(--color-ingreso)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={22}
                />

                <Bar
                  dataKey="egreso"
                  fill="var(--color-egreso)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Inventory alerts */}
        <Card className="border-[#E8E2D8] bg-white shadow-none">
          <CardHeader className="border-b border-[#F0ECE5] px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-[#22201D]">
                  Inventario
                </CardTitle>

                <p className="mt-1 text-xs text-[#918A7E]">
                  Estado de productos
                </p>
              </div>

              <div
                className={`flex size-9 items-center justify-center rounded-lg ${
                  totals.lowStock.length > 0
                    ? "bg-[#FBF0DE] text-[#B5842C]"
                    : "bg-[#E8F1EC] text-[#2E6B4F]"
                }`}
              >
                {totals.lowStock.length > 0 ? (
                  <AlertTriangle size={17} />
                ) : (
                  <Package size={17} />
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-[#6F695E]">
                Productos con stock bajo
              </span>

              <Badge
                variant="secondary"
                className={
                  totals.lowStock.length > 0
                    ? "bg-[#FBF0DE] text-[#9A6A18] hover:bg-[#FBF0DE]"
                    : "bg-[#E8F1EC] text-[#2E6B4F] hover:bg-[#E8F1EC]"
                }
              >
                {totals.lowStock.length}
              </Badge>
            </div>

            {totals.lowStock.length === 0 ? (
              <div className="border-t border-[#F0ECE5] px-5 py-8 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#E8F1EC] text-[#2E6B4F]">
                  <Package size={18} />
                </div>

                <p className="mt-3 text-sm font-medium text-[#383530]">
                  Inventario en orden
                </p>

                <p className="mt-1 text-xs text-[#9B9488]">
                  No hay productos por debajo del mínimo.
                </p>
              </div>
            ) : (
              <div className="border-t border-[#F0ECE5]">
                {totals.lowStock
                  .slice(0, 6)
                  .map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between gap-3 border-b border-[#F4F0E9] px-5 py-3.5 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#383530]">
                          {producto.nombre}
                        </p>

                        <p className="mt-0.5 text-[11px] text-[#9B9488]">
                          Mínimo:{" "}
                          {number(
                            producto.stock_minimo,
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-[#F9EAE6] px-2.5 py-1 text-xs font-semibold text-[#A3402A]">
                        {number(producto.stock)}
                      </span>
                    </div>
                  ))}

                {totals.lowStock.length > 6 && (
                  <div className="border-t border-[#F0ECE5] px-5 py-3 text-center text-xs text-[#8A8375]">
                    + {totals.lowStock.length - 6}{" "}
                    productos más
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Recent movements                                                   */}
      {/* ------------------------------------------------------------------ */}

      <Card className="border-[#E8E2D8] bg-white shadow-none">
        <CardHeader className="border-b border-[#F0ECE5] px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#22201D]">
                Movimientos recientes
              </CardTitle>

              <p className="mt-1 text-xs text-[#918A7E]">
                Últimas operaciones registradas
              </p>
            </div>

            <CircleDollarSign
              size={19}
              className="text-[#A39C90]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {recientes.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#F3F1EC] text-[#8A8375]">
                <TrendingUp size={19} />
              </div>

              <p className="mt-3 text-sm font-medium text-[#383530]">
                Sin movimientos todavía
              </p>

              <p className="mt-1 text-xs text-[#9B9488]">
                Las transacciones aparecerán aquí cuando
                sean registradas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0ECE5]">
              {recientes.map((transaccion) => {
                const esIngreso =
                  transaccion.tipo === "ingreso";

                return (
                  <div
                    key={transaccion.id}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FCFBF9]"
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                        esIngreso
                          ? "bg-[#E8F1EC] text-[#2E6B4F]"
                          : "bg-[#F7E9E5] text-[#A3402A]"
                      }`}
                    >
                      {esIngreso ? (
                        <ArrowUpRight size={17} />
                      ) : (
                        <ArrowDownRight size={17} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#383530]">
                        {transaccion.descripcion ||
                          transaccion.categoria}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#9B9488]">
                        <span>
                          {transaccion.categoria}
                        </span>

                        <span>·</span>

                        <span>
                          {formatearFecha(
                            transaccion.fecha,
                          )}
                        </span>

                        {transaccion.automatica && (
                          <>
                            <span>·</span>

                            <span>
                              Automático
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        esIngreso
                          ? "text-[#2E6B4F]"
                          : "text-[#A3402A]"
                      }`}
                    >
                      {esIngreso ? "+" : "-"}
                      {money(transaccion.monto)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}


"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardStats } from "./components/DashboardStats";
import { HorasPicoChart } from "./components/HorasPicoChart";
import { IngresosEgresosChart } from "./components/IngresosEgresosChart";
import { InventarioAlertas } from "./components/InventarioAlertas";
import { MovimientosRecientes } from "./components/MovimientosRecientes";
import { OrdenesPorDiaChart } from "./components/OrdenesPorDiaChart";
import { PlatosMasVendidos } from "./components/PlatosMasVendidos";
import { VentasPorCanal } from "./components/VentasPorCanal";
import { VentasPorCategoriaChart } from "./components/VentasPorCategoriaChart";
import { VentasPorMetodoPago } from "./components/VentasPorMetodoPago";
import { useDashboard } from "./hooks/useDashboard";

function DashboardSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-5 p-4 md:p-6 lg:p-8">
      <div className="h-24 animate-pulse rounded-2xl bg-white" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="h-[370px] animate-pulse rounded-2xl bg-white" />
        <div className="h-[370px] animate-pulse rounded-2xl bg-white" />
      </div>
    </main>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg border-[#E8D5D0] bg-[#FFF9F7] shadow-sm">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F8E2DD] text-[#A3402A]">
              <AlertTriangle size={19} />
            </div>
            <div>
              <h2 className="font-semibold text-[#54241D]">
                No se pudo cargar el dashboard
              </h2>
              <p className="mt-1 text-sm text-[#8A5349]">{message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function DashboardPage() {
  const dashboard = useDashboard();

  if (dashboard.loading) return <DashboardSkeleton />;
  if (dashboard.error) return <DashboardError message={dashboard.error} />;

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-5 p-4 md:p-6 lg:p-8">
      <DashboardHeader />

      <DashboardStats
        ingresos={dashboard.stats.ingresos}
        egresos={dashboard.stats.egresos}
        balance={dashboard.stats.balance}
        ordenes={dashboard.stats.ordenes}
        ticketPromedio={dashboard.stats.ticketPromedio}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <IngresosEgresosChart data={dashboard.ingresosEgresos} />
        <VentasPorCategoriaChart data={dashboard.ventasPorCategoria} />
      </section>

      <OrdenesPorDiaChart data={dashboard.ordenesPorDia} />

      <section className="grid gap-5 xl:grid-cols-2">
        <PlatosMasVendidos data={dashboard.platosMasVendidos} />
        <VentasPorMetodoPago data={dashboard.metodosPago} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <HorasPicoChart data={dashboard.horasPico} />
        <VentasPorCanal data={dashboard.ventasPorCanal} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <MovimientosRecientes movimientos={dashboard.movimientos} />
        <InventarioAlertas productos={dashboard.stats.stockBajo} />
      </section>
    </main>
  );
}

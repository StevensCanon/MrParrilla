"use client";

import { AlertTriangle } from "lucide-react";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardDateFilter } from "./components/DashboardDateFilter";
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

// Cada bloque ocupa su celda completa para que las tarjetas de una misma fila
// midan lo mismo. Si un componente ya define su propia altura fija, se respeta.
const celda = "min-w-0 [&>*]:h-full";

function DashboardSkeleton() {
  const bloque = "animate-pulse rounded-2xl border border-[#E7E1D7] bg-white";

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 p-4 md:p-6 lg:p-8">
      <div className={`h-32 ${bloque}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`h-36 ${bloque}`} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="flex flex-col gap-5 xl:col-span-8">
          <div className={`h-[300px] ${bloque}`} />
          <div className={`h-[260px] ${bloque}`} />
        </div>
        <div className="flex flex-col gap-5 xl:col-span-4">
          <div className={`h-[200px] ${bloque}`} />
          <div className={`h-[360px] ${bloque}`} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={`h-[260px] ${bloque}`} />
        ))}
      </div>
    </main>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-[#E7E1D7] bg-white p-6 shadow-sm">
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBEDEA] text-[#B3261E]">
            <AlertTriangle size={19} />
          </span>
          <div>
            <h2 className="font-semibold text-[#22201D]">
              No se pudo cargar el panel
            </h2>
            <p className="mt-1 text-sm text-[#6F695E]">{message}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const dashboard = useDashboard();

  if (dashboard.loading) return <DashboardSkeleton />;
  if (dashboard.error) return <DashboardError message={dashboard.error} />;

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 p-4 md:p-6 lg:p-8">
      <DashboardHeader>
        <DashboardDateFilter
          fechaExacta={dashboard.fechaExacta}
          fechaDesde={dashboard.fechaDesde}
          fechaHasta={dashboard.fechaHasta}
          onFechaExactaChange={dashboard.setFechaExacta}
          onFechaDesdeChange={dashboard.setFechaDesde}
          onFechaHastaChange={dashboard.setFechaHasta}
        />
      </DashboardHeader>

      {/* 1. Indicadores principales (sin cambios) */}
      <DashboardStats
        ingresos={dashboard.stats.ingresos}
        egresos={dashboard.stats.egresos}
        balance={dashboard.stats.balance}
        ordenes={dashboard.stats.ordenes}
      />

      {/* 2. Zona principal: columna ancha (8) + columna angosta (4).
          La última tarjeta de cada columna se estira para igualar el alto. */}
      <section className="grid gap-5 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-5 xl:col-span-8">
          <div className={celda}>
            <IngresosEgresosChart data={dashboard.ingresosEgresos} />
          </div>
          <section className="grid gap-5 md:grid-cols-2 ">
          <div className={celda}>
          <VentasPorMetodoPago data={dashboard.metodosPago} />
        </div>
        <div className={celda}>
          <VentasPorCanal data={dashboard.ventasPorCanal} />
        </div>
        </section>
         
        </div>

        <div className="flex min-w-0 flex-col gap-5 xl:col-span-4">
          <div className={celda}>
            <InventarioAlertas productos={dashboard.stats.stockBajo} />
          </div>
          <div className={`${celda} flex-1`}>
          <PlatosMasVendidos data={dashboard.platosMasVendidos} />
            
          </div>
        </div>
      </section>

      {/* 3. Tres tarjetas de igual peso */}
      <section className="grid gap-5 md:grid-cols-2 ">
        <div className={celda}>
        <OrdenesPorDiaChart data={dashboard.ordenesPorDia}/>
        </div>
        <div>
        < HorasPicoChart data={dashboard.horasPico}/>
        </div>
      </section>

      {/* 4. Listas de consulta con anchos distintos (7 + 5) */}
      <section className="grid gap-5 xl:grid-cols-12">
        <div className={`${celda} xl:col-span-7`}>
        <VentasPorCategoriaChart data={dashboard.ventasPorCategoria} />
        </div>
        <div className={`${celda} xl:col-span-5`}>
          <MovimientosRecientes movimientos={dashboard.movimientos} />
        </div>
      </section>
    </main>
  );
}
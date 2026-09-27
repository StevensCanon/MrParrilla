"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { DashboardStats } from "./components/dashboard/DashboardStats";
import { IngresosEgresosChart } from "./components/dashboard/IngresosEgresosChart";
import { InventarioAlertas } from "./components/dashboard/InventarioAlertas";
import { MovimientosRecientes } from "./components/dashboard/MovimientosRecientes";
import { useDashboard } from "./hooks/useDashboard";

function DashboardSkeleton() {
  return <main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6 lg:p-8"><div className="space-y-2"><div className="h-7 w-48 animate-pulse rounded-lg bg-[#EAE5DC]"/><div className="h-4 w-72 animate-pulse rounded-lg bg-[#F0ECE5]"/></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-32 animate-pulse rounded-2xl bg-white"/>)}</div><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="h-[390px] animate-pulse rounded-2xl bg-white"/><div className="h-[390px] animate-pulse rounded-2xl bg-white"/></div></main>;
}

function DashboardError({message}:{message:string}) {
 return <main className="flex min-h-[70vh] items-center justify-center p-6"><Card className="w-full max-w-lg border-[#E8D5D0] bg-[#FFF9F7] shadow-none"><CardContent className="p-6"><div className="flex gap-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F8E2DD] text-[#A3402A]"><AlertTriangle size={19}/></div><div><h2 className="font-semibold text-[#54241D]">No se pudo cargar el dashboard</h2><p className="mt-1 text-sm text-[#8A5349]">{message}</p></div></div></CardContent></Card></main>;
}

export default function DashboardPage() {
 const dashboard=useDashboard();
 if(dashboard.loading) return <DashboardSkeleton/>;
 if(dashboard.error) return <DashboardError message={dashboard.error}/>;

 return <main className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6 lg:p-8">
  <DashboardHeader/>
  <DashboardStats {...dashboard.stats}/>
  <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
   <IngresosEgresosChart data={dashboard.ingresosEgresos}/>
   <InventarioAlertas productos={dashboard.stats.stockBajo}/>
  </section>
  <MovimientosRecientes movimientos={dashboard.movimientos}/>
 </main>;
}

"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { CategoriaVenta } from "../hooks/useDashboard";

const colores = ["#C85C3D", "#3D8060", "#3B82F6", "#EAB308", "#8B5CF6", "#14B8A6"];
const config = { monto: { label: "Ventas", color: "#C85C3D" } } satisfies ChartConfig;
const money = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.round(v || 0));

export function VentasPorCategoriaChart({ data }: { data: CategoriaVenta[] }) {
  const total = data.reduce((sum, item) => sum + item.monto, 0);
  return (
    <Card className="overflow-hidden border-[#E7E1D7] bg-white shadow-sm">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-4">
        <CardTitle className="text-base">Ventas por categoría</CardTitle>
        <p className="mt-1 text-xs text-[#918A7E]">Distribución de ventas de platos</p>
      </CardHeader>
      <CardContent className="min-h-[310px] p-5">
        {data.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-[#9B9488]">Sin ventas de platos.</div>
        ) : (
          <div className="flex h-[270px] items-center gap-4">
            <div className="relative shrink-0">
              <ChartContainer config={config} className="h-[190px] w-[190px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => money(Number(value))} />} />
                  <Pie data={data} dataKey="monto" nameKey="categoria" innerRadius={58} outerRadius={82} paddingAngle={3} strokeWidth={0}>
                    {data.map((item, index) => <Cell key={item.categoria} fill={colores[index % colores.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9B9488]">Total</span>
                <span className="mt-0.5 text-sm font-bold text-[#292621]">{money(total)}</span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              {data.slice(0, 6).map((item, index) => (
                <div key={item.categoria} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colores[index % colores.length] }} />
                    <span className="truncate text-[#5F594F]">{item.categoria}</span>
                  </div>
                  <span className="shrink-0 font-semibold text-[#292621]">{money(item.monto)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

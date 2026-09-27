"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { CategoriaVenta } from "../../hooks/useDashboard";

const config = { monto: { label: "Ventas", color: "#A3402A" } } satisfies ChartConfig;
const money = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.round(v || 0));

export function VentasPorCategoriaChart({ data }: { data: CategoriaVenta[] }) {
  const total = data.reduce((sum, item) => sum + item.monto, 0);
  return (
    <Card className="border-[#E8E2D8] bg-white shadow-none">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-5">
        <CardTitle className="text-base">Ventas por categoría</CardTitle>
        <p className="text-xs text-[#918A7E]">Distribución de ventas de platos</p>
      </CardHeader>
      <CardContent className="flex min-h-[300px] items-center justify-center gap-5 p-5">
        {data.length === 0 ? <p className="text-sm text-[#9B9488]">Sin ventas de platos.</p> : (
          <>
            <ChartContainer config={config} className="h-[250px] w-[250px] shrink-0">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => money(Number(value))} />} />
                <Pie data={data} dataKey="monto" nameKey="categoria" innerRadius={65} outerRadius={95} paddingAngle={3} strokeWidth={0}>
                  {data.map((item, index) => <Cell key={item.categoria} fill={`hsl(${12 + index * 28} 38% ${42 + (index % 3) * 8}%)`} />)}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="min-w-0 flex-1 space-y-2">
              {data.slice(0, 6).map((item, index) => (
                <div key={item.categoria} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: `hsl(${12 + index * 28} 38% ${42 + (index % 3) * 8}%)` }} />
                    <span className="truncate text-[#5F594F]">{item.categoria}</span>
                  </div>
                  <span className="shrink-0 font-medium text-[#292621]">{money(item.monto)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

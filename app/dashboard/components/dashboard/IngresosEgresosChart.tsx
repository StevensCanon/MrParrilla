"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DiaFinanciero } from "../../hooks/useDashboard";
const config = {
  ingreso: { label: "Ingresos", color: "#2E6B4F" },
  egreso: { label: "Egresos", color: "#A3402A" },
} satisfies ChartConfig;
const money = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(v || 0));
export function IngresosEgresosChart({ data }: { data: DiaFinanciero[] }) {
  return (
    <Card className="border-[#E8E2D8] bg-white shadow-none">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-5">
        <CardTitle className="text-base">Movimiento financiero</CardTitle>
        <p className="text-xs text-[#918A7E]">Ingresos y egresos por día</p>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-5 sm:px-5">
        <ChartContainer config={config} className="h-[310px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 8, right: 8, left: -15, bottom: 0 }}
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
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(v) =>
                Number(v) >= 1000000
                  ? Math.round(Number(v) / 1000000) + "M"
                  : Number(v) >= 1000
                    ? Math.round(Number(v) / 1000) + "K"
                    : String(v)
              }
            />
            <ChartTooltip
              cursor={{ fill: "#F6F3EE" }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex min-w-[140px] justify-between gap-4">
                      <span>{name === "ingreso" ? "Ingresos" : "Egresos"}</span>
                      <span className="font-mono">{money(Number(value))}</span>
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
  );
}

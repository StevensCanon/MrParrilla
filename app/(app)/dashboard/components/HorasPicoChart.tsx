"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { HoraPico } from "../hooks/useDashboard";

const config = {
  ordenes: {
    label: "Órdenes",
    color: "#22201D", // Tono grafito/carbón acorde a la paleta del sistema
  },
} satisfies ChartConfig;

export function HorasPicoChart({ data }: { data: HoraPico[] }) {
  return (
    <Card className="overflow-hidden border-[#E7E1D7] bg-white shadow-sm">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[#22201D]">Horas pico</CardTitle>
            <p className="mt-1 text-xs text-[#918A7E]">Volumen y flujo de órdenes por franja horaria</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-5 sm:px-5">
        {data.length === 0 ? (
          <p className="py-20 text-center text-sm text-[#9B9488]">Sin datos de operación.</p>
        ) : (
          <ChartContainer config={config} className="h-[280px] w-full">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: -15, bottom: 0 }}>
              <defs>
                {/* Degradado vertical sutil */}
                <linearGradient id="fillOrdenes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-ordenes)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--color-ordenes)" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="#ECE7DE" strokeDasharray="4 4" />
              
              <XAxis 
                dataKey="hora" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={10}
                tick={{ fill: "#918A7E", fontSize: 12 }}
              />
              
              <YAxis 
                allowDecimals={false} 
                tickLine={false} 
                axisLine={false} 
                width={35}
                tick={{ fill: "#918A7E", fontSize: 12 }}
              />
              
              <ChartTooltip 
                cursor={{ stroke: "#D8D0C3", strokeWidth: 1, strokeDasharray: "3 3" }} 
                content={<ChartTooltipContent indicator="line" />} 
              />
              
              <Area
                type="natural"
                dataKey="ordenes"
                stroke="var(--color-ordenes)"
                strokeWidth={2.5}
                fill="url(#fillOrdenes)"
                activeDot={{
                  r: 5,
                  fill: "var(--color-ordenes)",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
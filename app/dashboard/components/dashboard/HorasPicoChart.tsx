"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { HoraPico } from "../../hooks/useDashboard";

const config = { ordenes: { label: "Órdenes", color: "#3D8060" } } satisfies ChartConfig;

export function HorasPicoChart({ data }: { data: HoraPico[] }) {
  return (
    <Card className="border-[#E8E2D8] bg-white shadow-none">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-5"><CardTitle className="text-base">Horas pico</CardTitle><p className="text-xs text-[#918A7E]">Órdenes iniciadas por hora</p></CardHeader>
      <CardContent className="px-2 pb-4 pt-5 sm:px-5">
        {data.length === 0 ? <p className="py-20 text-center text-sm text-[#9B9488]">Sin datos de operación.</p> : (
          <ChartContainer config={config} className="h-[300px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#ECE7DE" strokeDasharray="4 4" />
              <XAxis dataKey="hora" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={35} />
              <ChartTooltip cursor={{ fill: "#F6F3EE" }} content={<ChartTooltipContent />} />
              <Bar dataKey="ordenes" fill="var(--color-ordenes)" radius={[5, 5, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

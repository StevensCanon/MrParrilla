"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { DiaOperativo } from "../../hooks/useDashboard";

const config = { ordenes: { label: "Órdenes", color: "#C85C3D" } } satisfies ChartConfig;

export function OrdenesPorDiaChart({ data }: { data: DiaOperativo[] }) {
  return (
    <Card className="border-[#E8E2D8] bg-white shadow-none">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-5"><CardTitle className="text-base">Órdenes por día</CardTitle><p className="text-xs text-[#918A7E]">Comandas cerradas durante el período</p></CardHeader>
      <CardContent className="px-2 pb-4 pt-5 sm:px-5">
        <ChartContainer config={config} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#ECE7DE" strokeDasharray="4 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={35} />
            <ChartTooltip cursor={{ fill: "#F6F3EE" }} content={<ChartTooltipContent />} />
            <Bar dataKey="ordenes" fill="var(--color-ordenes)" radius={[5, 5, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

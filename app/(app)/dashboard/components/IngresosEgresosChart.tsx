"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { DiaFinanciero } from "../hooks/useDashboard";

const chartConfig = {
  ingreso: {
    label: "Ingresos",
    color: "#166534",
  },
  egreso: {
    label: "Egresos",
    color: "#EF4444",
  },
} satisfies ChartConfig;

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));

const formatAxisValue = (value: number) => {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("es-CO", {
      maximumFractionDigits: 1,
    })} M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toLocaleString("es-CO", {
      maximumFractionDigits: 0,
    })} mil`;
  }

  return value.toString();
};

export function IngresosEgresosChart({
  data,
}: {
  data: DiaFinanciero[];
}) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <Card className="overflow-hidden border-[#E7E1D7] bg-white shadow-sm">
      <CardHeader className="border-b border-[#E7E1D7] px-5 py-4">
        <CardTitle className="text-base font-bold">
          Movimiento financiero
        </CardTitle>

        <CardDescription className="mt-1 text-xs text-[#6F695E]">
          Ingresos y egresos por día
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pb-4 pt-5 sm:px-5">
        {data.length === 0 ? (
          <div className="flex h-[310px] items-center justify-center text-sm text-[#6F695E]">
            No hay movimientos financieros para mostrar.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[310px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`${gradientId}-ingreso`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-ingreso)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-ingreso)"
                    stopOpacity={0.02}
                  />
                </linearGradient>

                <linearGradient
                  id={`${gradientId}-egreso`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-egreso)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-egreso)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="#ECE7DE"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tick={{ fill: "#918A7E", fontSize: 11 }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={55}
                domain={[0, "auto"]}
                tick={{ fill: "#918A7E", fontSize: 10 }}
                tickFormatter={(value: number) =>
                  formatAxisValue(value)
                }
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => (
                      <div className="flex min-w-[140px] items-center justify-between gap-4">
                        <span>
                          {name === "ingreso" ? "Ingresos" : "Egresos"}
                        </span>
                        <span className="font-mono font-medium">
                          {money(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />

              <Area
                dataKey="ingreso"
                type="monotone"
                stroke="var(--color-ingreso)"
                strokeWidth={2}
                fill={`url(#${gradientId}-ingreso)`}
                activeDot={{ r: 4 }}
              />

              <Area
                dataKey="egreso"
                type="monotone"
                stroke="var(--color-egreso)"
                strokeWidth={2}
                fill={`url(#${gradientId}-egreso)`}
                activeDot={{ r: 4 }}
              />

              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

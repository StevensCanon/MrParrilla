"use client";

import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { HoraPico } from "../hooks/useDashboard";

const config = {
  ordenes: {
    label: "Órdenes",
    color: "#22201D",
  },
} satisfies ChartConfig;

const HORAS_JORNADA = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

export function HorasPicoChart({ data }: { data: HoraPico[] }) {
  // Asegura la secuencia ininterrumpida de 07:00 a 19:00 con 0 en horas vacías
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const map = new Map<string, number>();
    for (const item of data) {
      // Normaliza formatos tipo "7:00" o "07:00"
      const horaKey = item.hora.padStart(5, "0");
      map.set(horaKey, item.ordenes ?? 0);
    }

    return HORAS_JORNADA.map((hora) => ({
      hora,
      ordenes: map.get(hora) ?? 0,
    }));
  }, [data]);

  return (
    <Card className="overflow-hidden border-[#E7E1D7] bg-white shadow-sm">
      <CardHeader className="border-b border-[#E7E1D7] px-5 py-4">
        <CardTitle className="text-base font-bold text-[#22201D]">
          Horas pico
        </CardTitle>

        <CardDescription className="mt-1 text-xs text-[#6F695E]">
          Volumen de órdenes por franja horaria (07:00 - 19:00)
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pb-4 pt-5 sm:px-5">
        {formattedData.length === 0 ? (
          <p className="py-20 text-center text-sm text-[#6F695E]">
            Sin datos de operación.
          </p>
        ) : (
          <ChartContainer
            config={config}
            className="mx-auto h-[320px] w-full max-w-[440px]"
          >
            <RadarChart
              data={formattedData}
              accessibilityLayer
              margin={{ top: 16, right: 28, bottom: 16, left: 28 }}
            >
              <PolarGrid stroke="#ECE7DE" />

              <PolarAngleAxis
                dataKey="hora"
                tickLine={false}
                tick={{ fill: "#918A7E", fontSize: 10 }}
              />

              <PolarRadiusAxis
                angle={90}
                domain={[0, "auto"]}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={false}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) => (
                      <div className="flex min-w-[100px] items-center justify-between gap-3">
                        <span>Órdenes</span>
                        <span className="font-mono font-medium">
                          {Number(value).toLocaleString("es-CO")}
                        </span>
                      </div>
                    )}
                  />
                }
              />

              <Radar
                dataKey="ordenes"
                name="Órdenes"
                stroke="var(--color-ordenes)"
                fill="var(--color-ordenes)"
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: "var(--color-ordenes)",
                  stroke: "#FFFFFF",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 5,
                  fill: "var(--color-ordenes)",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

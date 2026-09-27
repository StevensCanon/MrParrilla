import { ArrowDownRight, ArrowUpRight, CircleDollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MovimientoDashboard } from "../hooks/useDashboard";

const money = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.round(v || 0));

export function MovimientosRecientes({ movimientos }: { movimientos: MovimientoDashboard[] }) {
  return (
    <Card className="overflow-hidden border-[#E7E1D7] bg-white shadow-sm">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Movimientos recientes</CardTitle>
            <p className="mt-1 text-xs text-[#918A7E]">Ingresos y egresos registrados</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#EEF5F1] text-[#3D8060]"><CircleDollarSign size={17} /></div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {movimientos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#8A8375]">Sin movimientos todavía</p>
        ) : (
          <div className="divide-y divide-[#F0ECE5]">
            {movimientos.map((movimiento) => {
              const ingreso = movimiento.tipo === "ingreso";
              return (
                <div key={movimiento.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${ingreso ? "bg-[#E8F1EC] text-[#2E6B4F]" : "bg-[#F7E9E5] text-[#A3402A]"}`}>
                    {ingreso ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#38342E]">{movimiento.descripcion || movimiento.categoria}</p>
                    <p className="mt-1 text-[11px] text-[#9B9488]">
                      {movimiento.categoria} · {new Date(movimiento.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold ${ingreso ? "text-[#2E6B4F]" : "text-[#A3402A]"}`}>
                    {ingreso ? "+" : "-"}{money(movimiento.monto)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

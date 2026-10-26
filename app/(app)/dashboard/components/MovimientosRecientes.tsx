import { ArrowDownRight, ArrowUpRight, CircleDollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MovimientoDashboard } from "../hooks/useDashboard";

const money = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.round(v || 0));

export function MovimientosRecientes({ movimientos }: { movimientos: MovimientoDashboard[] }) {
  return (
    <Card className="overflow-hidden border-[#E7E1D7] bg-white shadow-sm">
      <CardHeader className="border-b border-[#E7E1D7] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Movimientos recientes</CardTitle>
            <p className="mt-1 text-xs text-[#6F695E]">Ingresos y egresos registrados</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#EFF8F2] text-[#2E6B4F]"><CircleDollarSign size={17} /></div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {movimientos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#6F695E]">Sin movimientos todavía</p>
        ) : (
          <div className="divide-y divide-[#E7E1D7]">
            {movimientos.map((movimiento) => {
              const ingreso = movimiento.tipo === "ingreso";
              return (
                <div key={movimiento.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${ingreso ? "bg-[#EFF8F2] text-[#2E6B4F]" : "bg-[#FFF0EA] text-[#A3402A]"}`}>
                    {ingreso ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#22201D]">{movimiento.descripcion || movimiento.categoria}</p>
                    <p className="mt-1 text-[11px] text-[#6F695E]">
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatoVendido } from "../../hooks/useDashboard";

export function PlatosMasVendidos({ data }: { data: PlatoVendido[] }) {
  const max = data[0]?.cantidad ?? 1;
  return (
    <Card className="border-[#E8E2D8] bg-white shadow-none">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-5">
        <CardTitle className="text-base">Platos más vendidos</CardTitle>
        <p className="text-xs text-[#918A7E]">Unidades vendidas</p>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {data.length === 0 ? <p className="py-10 text-center text-sm text-[#9B9488]">Sin ventas de platos.</p> : data.map((plato, index) => (
          <div key={plato.nombre + index} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 truncate"><span className="mr-2 text-xs font-semibold text-[#A3402A]">{String(index + 1).padStart(2, "0")}</span><span className="font-medium text-[#3B3731]">{plato.nombre}</span></div>
              <span className="shrink-0 font-semibold text-[#22201D]">{plato.cantidad}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#F0ECE5]"><div className="h-full rounded-full bg-[#C85C3D]" style={{ width: Math.max((plato.cantidad / max) * 100, 4) + "%" }} /></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

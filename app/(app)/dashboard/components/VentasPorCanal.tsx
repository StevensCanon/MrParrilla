import { MessageCircle, Store, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CanalVenta } from "../hooks/useDashboard";

const money = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.round(v || 0));
const icons = { Restaurante: Store, Domicilio: Truck, WhatsApp: MessageCircle } as const;

export function VentasPorCanal({ data }: { data: CanalVenta[] }) {
  return (
    <Card className="overflow-hidden border-[#E7E1D7] bg-white shadow-sm">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-4">
        <CardTitle className="text-base">Ventas por canal</CardTitle>
        <p className="mt-1 text-xs text-[#918A7E]">Origen de las órdenes</p>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {data.length === 0 ? <p className="py-10 text-center text-sm text-[#9B9488]">Sin ventas por canal.</p> : data.map((item) => {
          const Icon = icons[item.canal as keyof typeof icons] ?? Store;
          return <div key={item.canal} className="flex items-center justify-between rounded-xl border border-[#EEE9E0] p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#F3F1EC] text-[#6F695E]"><Icon size={17} /></div>
              <div><p className="text-sm font-semibold text-[#38342E]">{item.canal}</p><p className="text-xs text-[#9B9488]">{item.ordenes} orden{item.ordenes === 1 ? "" : "es"}</p></div>
            </div>
            <span className="text-sm font-bold text-[#22201D]">{money(item.monto)}</span>
          </div>;
        })}
      </CardContent>
    </Card>
  );
}

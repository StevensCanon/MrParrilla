import { Banknote, CreditCard, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MetodoPago } from "../../hooks/useDashboard";

const money = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.round(v || 0));
const icons = { Efectivo: Banknote, Tarjeta: CreditCard, Transferencia: Landmark } as const;

export function VentasPorMetodoPago({ data }: { data: MetodoPago[] }) {
  const total = data.reduce((sum, item) => sum + item.monto, 0);
  return (
    <Card className="border-[#E8E2D8] bg-white shadow-none">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-5"><CardTitle className="text-base">Métodos de pago</CardTitle><p className="text-xs text-[#918A7E]">Ventas confirmadas</p></CardHeader>
      <CardContent className="space-y-3 p-5">
        {data.length === 0 ? <p className="py-10 text-center text-sm text-[#9B9488]">Sin pagos registrados.</p> : data.map((item) => {
          const Icon = icons[item.metodo as keyof typeof icons] ?? CreditCard;
          const porcentaje = total > 0 ? (item.monto / total) * 100 : 0;
          return <div key={item.metodo} className="rounded-xl bg-[#F8F6F1] p-3.5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-white text-[#6F695E]"><Icon size={17} /></div><div><p className="text-sm font-medium text-[#38342E]">{item.metodo}</p><p className="text-xs text-[#9B9488]">{item.cantidad} pago{item.cantidad === 1 ? "" : "s"}</p></div></div><span className="text-sm font-semibold text-[#22201D]">{money(item.monto)}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAE5DC]"><div className="h-full rounded-full bg-[#3D8060]" style={{ width: porcentaje + "%" }} /></div></div>;
        })}
      </CardContent>
    </Card>
  );
}

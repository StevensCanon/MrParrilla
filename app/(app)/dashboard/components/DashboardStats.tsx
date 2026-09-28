import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Receipt,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
  valueClass,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Wallet;
  accent: string;
  valueClass?: string;
}) {
  return (
    <Card className="relative overflow-hidden border-[#E7E1D7] bg-white shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#8A8375]">
              {title}
            </p>
            <p className={`mt-2 truncate text-2xl font-bold tracking-tight ${valueClass ?? "text-[#22201D]"}`}>
              {value}
            </p>
            <p className="mt-1 text-xs text-[#9B9488]">{description}</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F8F6F1] text-[#6F695E]">
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats({
  ingresos,
  egresos,
  balance,
  ordenes,
 
}: {
  ingresos: number;
  egresos: number;
  balance: number;
  ordenes: number;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Ventas" value={money(ingresos)} description="Pagos confirmados" icon={ArrowUpRight} accent="bg-green-600" valueClass="text-green-800" />
      <StatCard title="Egresos" value={money(egresos)} description="Salidas registradas" icon={ArrowDownRight} accent="bg-[#C62828]" valueClass="text-[#A3402A]" />
      <StatCard title="Utilidad" value={money(balance)} description="Ventas menos egresos" icon={Wallet} accent="bg-[#3B82F6]" valueClass={balance >= 0 ? "text-black" : "text-black"} />
      <StatCard title="Órdenes" value={ordenes.toLocaleString("es-CO")} description="Comandas cerradas" icon={ClipboardList} accent="bg-[#EAB308]" />
    </section>
  );
}

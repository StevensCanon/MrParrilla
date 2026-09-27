import { ArrowDownRight, ArrowUpRight, ClipboardList, Receipt, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

<<<<<<< HEAD
const money = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(v || 0));

function Item({
  title,
  value,
  desc,
  icon: Icon,
  cls,
}: {
  title: string;
  value: string;
  desc: string;
  icon: typeof Wallet;
  cls?: string;
}) {
  return (
    <Card className="border-[#E8E2D8] bg-white shadow-none">
      <CardContent className="p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#8A8375]">
              {title}
            </p>
            <p
              className={"mt-2 text-2xl font-bold " + (cls || "text-[#22201D]")}
            >
              {value}
            </p>
            <p className="mt-1 text-xs text-[#9B9488]">{desc}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#F3F1EC] text-[#6F695E]">
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
  inventario,
  productos,
}: {
  ingresos: number;
  egresos: number;
  balance: number;
  inventario: number;
  productos: number;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Item
        title="Balance"
        value={money(balance)}
        desc="Ingresos menos egresos"
        icon={Wallet}
        cls={balance >= 0 ? "text-[#2E6B4F]" : "text-[#A3402A]"}
      />
      <Item
        title="Ingresos"
        value={money(ingresos)}
        desc="Entradas registradas"
        icon={ArrowUpRight}
        cls="text-[#2E6B4F]"
      />
      <Item
        title="Egresos"
        value={money(egresos)}
        desc="Salidas registradas"
        icon={ArrowDownRight}
        cls="text-[#A3402A]"
      />
      <Item
        title="Inventario"
        value={money(inventario)}
        desc={productos + " productos registrados"}
        icon={Boxes}
      />
    </section>
  );
=======
const money = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.round(v || 0));

function Item({ title, value, desc, icon: Icon, className = "text-[#22201D]" }: { title: string; value: string; desc: string; icon: typeof Wallet; className?: string }) {
  return <Card className="border-[#E8E2D8] bg-white shadow-none"><CardContent className="p-5"><div className="flex justify-between gap-4"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-[0.08em] text-[#8A8375]">{title}</p><p className={`mt-2 truncate text-2xl font-bold ${className}`}>{value}</p><p className="mt-1 text-xs text-[#9B9488]">{desc}</p></div><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F1EC] text-[#6F695E]"><Icon size={18} /></div></div></CardContent></Card>;
}

export function DashboardStats({ ingresos, egresos, balance, ordenes, ticketPromedio }: { ingresos: number; egresos: number; balance: number; inventario: number; ordenes: number; ticketPromedio: number }) {
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
    <Item title="Ventas" value={money(ingresos)} desc="Pagos confirmados" icon={ArrowUpRight} className="text-[#2E6B4F]" />
    <Item title="Egresos" value={money(egresos)} desc="Salidas registradas" icon={ArrowDownRight} className="text-[#A3402A]" />
    <Item title="Utilidad" value={money(balance)} desc="Ventas menos egresos" icon={Wallet} className={balance >= 0 ? "text-[#2E6B4F]" : "text-[#A3402A]"} />
    <Item title="Órdenes" value={String(ordenes)} desc="Comandas cerradas" icon={ClipboardList} />
    <Item title="Ticket promedio" value={money(ticketPromedio)} desc="Venta promedio por orden" icon={Receipt} />
  </section>;
>>>>>>> f22c123737600728a2589a1fe80e9ceedeb58c99
}

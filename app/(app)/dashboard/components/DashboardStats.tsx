import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Wallet,
} from "lucide-react";

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  })
    .format(Math.round(value || 0))
    .replace(/\s/g, "");

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  destacada,
  negativo,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Wallet;
  destacada?: boolean;
  negativo?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E7E1D7] p-5 shadow-sm ${
        destacada
          ? "bg-gradient-to-br from-white via-white to-red-50/70"
          : "bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FBEDEA] text-[#B3261E]">
          <Icon size={18} />
        </span>
        <p className="text-sm font-medium text-[#6F695E]">{title}</p>
      </div>

      <p
        className={`mt-5 truncate text-3xl font-semibold tracking-tight tabular-nums ${
          negativo ? "text-[#B3261E]" : "text-[#22201D]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-[#6F695E]">{description}</p>
    </div>
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
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Ventas"
        value={money(ingresos)}
        description="Pagos confirmados"
        icon={ArrowUpRight}
        destacada
      />
      <StatCard
        title="Egresos"
        value={money(egresos)}
        description="Salidas registradas"
        icon={ArrowDownRight}
      />
      <StatCard
        title="Balance"
        value={money(balance)}
        description="Ventas menos egresos"
        icon={Wallet}
        negativo={balance < 0}
      />
      <StatCard
        title="Órdenes"
        value={ordenes.toLocaleString("es-CO")}
        description="Comandas cerradas"
        icon={ClipboardList}
      />
    </section>
  );
}
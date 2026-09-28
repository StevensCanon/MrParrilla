import { CalendarDays, TrendingUp } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-[#E7E1D7] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#C85C3D]">
          <span className="flex size-6 items-center justify-center rounded-lg bg-[#FFF0EA]">
            <TrendingUp size={13} />
          </span>
          Resumen del restaurante
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#22201D] md:text-3xl">
         Panel de Control
        </h1>
        <p className="mt-1 text-sm text-[#8A8375]">
          Ventas, operación e inventario en una sola vista.
        </p>
      </div>
      <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E7E1D7] bg-[#F8F6F1] px-3 py-2 text-xs font-semibold text-[#6F695E]">
        <CalendarDays size={15} className="text-[#C85C3D]" />
        Últimos 14 días
      </div>
    </header>
  );
}

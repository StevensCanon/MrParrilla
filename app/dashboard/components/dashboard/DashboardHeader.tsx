import { CalendarDays } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#A3402A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A3402A]" />
          Resumen del restaurante
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#22201D] md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#8A8375]">
          Ventas, operación e inventario en una sola vista.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-[#8A8375]">
        <CalendarDays size={15} />
        <span>Últimos 14 días</span>
      </div>
    </header>
  );
}

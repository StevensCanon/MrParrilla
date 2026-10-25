import type { ReactNode } from "react";
import { TrendingUp } from "lucide-react";

/**
 * Encabezado del panel. Los hijos (el filtro de periodo) se ubican a la
 * derecha en escritorio y debajo del título en móvil, dentro de la misma tarjeta.
 */
export function DashboardHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-[#E7E1D7] bg-white p-5 shadow-sm sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#C85C3D]">
          <span className="flex size-4 items-center justify-center rounded-lg bg-[#FFF0EA]">
            <TrendingUp size={13} />
          </span>
          Resumen del restaurante
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#22201D]">
          Panel de Control
        </h1>
        <p className="mt-1 text-xs text-[#8A8375]">
          Ventas, operación e inventario en una sola vista.
        </p>
      </div>

      {children}
    </header>
  );
}
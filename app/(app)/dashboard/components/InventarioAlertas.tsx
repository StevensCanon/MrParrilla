import { AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductoDashboard } from "../services/dashboard";

export function InventarioAlertas({ productos }: { productos: ProductoDashboard[] }) {
  return (
    <Card className="overflow-hidden border-[#E7E1D7] bg-white shadow-sm">
      <CardHeader className="border-b border-[#F0ECE5] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Inventario</CardTitle>
            <p className="mt-1 text-xs text-[#918A7E]">Productos que requieren atención</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFF7DF] text-[#B5842C]">
            {productos.length ? <AlertTriangle size={17} /> : <Package size={17} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm font-medium text-[#6F695E]">Stock bajo</span>
          <Badge variant="secondary">{productos.length}</Badge>
        </div>
        {productos.length === 0 ? (
          <div className="border-t border-[#F0ECE5] px-5 py-10 text-center text-sm text-[#6F695E]">Inventario en orden</div>
        ) : (
          <div className="border-t border-[#F0ECE5]">
            {productos.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-[#F0ECE5] px-5 py-3.5 last:border-0">
                <span className="truncate text-sm font-medium text-[#38342E]">{p.nombre}</span>
                <span className="rounded-lg bg-[#F9EAE6] px-2.5 py-1 text-xs font-bold text-[#A3402A]">{p.stock}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

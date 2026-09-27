import { Loader2 } from "lucide-react";

export default function InventarioLoading() {
  return (
    <div className="flex min-h-[350px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[#B91C1C]" />
    </div>
  );
}
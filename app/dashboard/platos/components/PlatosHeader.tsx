import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type PlatosHeaderProps = {
  onCrear: () => void;
};

export default function PlatosHeader({
  onCrear,
}: PlatosHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-[#211F1B] sm:text-[28px]">
          Platos
        </h1>

        <p className="mt-1 text-sm text-[#8A8577]">
          Administra el menú y la disponibilidad de tus platos.
        </p>
      </div>

      <Button
        type="button"
        onClick={onCrear}
        className="w-fit cursor-pointer gap-1.5 rounded-full bg-black px-4 text-white shadow-none hover:bg-[#211F1B]/90"
      >
        <Plus size={16} strokeWidth={2.5} />
        Nuevo plato
      </Button>
    </div>
  );
}
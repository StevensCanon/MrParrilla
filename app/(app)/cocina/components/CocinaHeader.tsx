import { RefreshCw } from "lucide-react";

type CocinaHeaderProps = {
  actualizando: boolean;
  onActualizar: () => void;
};

export default function CocinaHeader({
  actualizando,
  onActualizar,
}: CocinaHeaderProps) {
  return (
    <header className="mb-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#22201D] sm:text-3xl">
        Cocina
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Solo aparece mientras carga; no ocupa espacio cuando no hay nada que decir */}
        <span
          role="status"
          aria-live="polite"
          className="min-w-[6rem] text-right text-xs text-[#8A8375]"
        >
          {actualizando ? "Actualizando…" : ""}
        </span>

        <button
          type="button"
          onClick={onActualizar}
          disabled={actualizando}
          aria-label="Actualizar comandas"
          title="Actualizar"
          className="flex size-11 items-center justify-center rounded-xl border border-[#E8E3DA] bg-white text-[#6F695E] shadow-sm transition-colors hover:bg-[#F5F2ED] hover:text-[#22201D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22201D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={18}
            aria-hidden="true"
            className={actualizando ? "animate-spin motion-reduce:animate-none" : ""}
          />
        </button>
      </div>
    </header>
  );
}

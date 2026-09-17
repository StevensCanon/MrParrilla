type PlatosErrorProps = {
    mensaje: string;
    onCerrar: () => void;
  };
  
  export default function PlatosError({
    mensaje,
    onCerrar,
  }: PlatosErrorProps) {
    return (
      <div className="flex items-center justify-between rounded-[10px] bg-[#FBEAE8] px-4 py-3 text-sm text-[#C6433C]">
        <span>{mensaje}</span>
  
        <button
          type="button"
          onClick={onCerrar}
          className="ml-3 shrink-0 text-xs font-medium underline underline-offset-2"
        >
          Cerrar
        </button>
      </div>
    );
  }
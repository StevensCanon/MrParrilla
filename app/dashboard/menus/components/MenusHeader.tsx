type MenusHeaderProps = {
    onCrear: () => void;
  };
  
  export default function MenusHeader({
    onCrear,
  }: MenusHeaderProps) {
    return (
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Menús
          </h1>
  
          <p className="mt-1 text-sm text-zinc-500">
            Administra los menús disponibles y consulta su configuración.
          </p>
        </div>
  
        <button
          type="button"
          onClick={onCrear}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-zinc-900
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            shadow-sm
            transition
            hover:bg-zinc-800
          "
        >
          <span className="text-base leading-none">
            +
          </span>
  
          Crear menú del día
        </button>
      </div>
    );
  }
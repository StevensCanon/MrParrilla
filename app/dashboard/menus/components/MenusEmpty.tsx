type MenusEmptyProps = {
    hayFiltros: boolean;
    onCrear: () => void;
    onLimpiar: () => void;
  };
  
  export default function MenusEmpty({
    hayFiltros,
    onCrear,
    onLimpiar,
  }: MenusEmptyProps) {
    return (
      <div className="flex min-h-[350px] items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div
            className="
              mx-auto
              mb-4
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-zinc-100
              text-xl
            "
          >
            🍽️
          </div>
  
          <h3 className="text-sm font-semibold text-zinc-800">
            {hayFiltros
              ? 'No hay menús con esos filtros'
              : 'No hay menús creados'}
          </h3>
  
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            {hayFiltros
              ? 'Prueba con otra fecha o limpia los filtros para ver todos los menús.'
              : 'Crea el menú del día para comenzar a configurar los platos disponibles.'}
          </p>
  
          {hayFiltros ? (
            <button
              type="button"
              onClick={onLimpiar}
              className="
                mt-5
                rounded-lg
                border
                border-zinc-200
                px-4
                py-2.5
                text-sm
                font-medium
                text-zinc-700
                transition
                hover:bg-zinc-100
              "
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              type="button"
              onClick={onCrear}
              className="
                mt-5
                rounded-lg
                bg-zinc-900
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                transition
                hover:bg-zinc-800
              "
            >
              Crear menú del día
            </button>
          )}
        </div>
      </div>
    );
  }
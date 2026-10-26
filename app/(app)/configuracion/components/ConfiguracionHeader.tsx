
import type { SeccionConfiguracion } from "../types/configuracion";

type Props = {
  seccion: SeccionConfiguracion;
  cantidadUsuarios: number;
};

export function ConfiguracionHeader({
  seccion,
  cantidadUsuarios,
}: Props) {
  return (
    <header className="border-b border-[#E7E1D7] pb-5">
      <p className="text-xs font-semibold text-[#A3402A]">
        {seccion.grupo}
      </p>

      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#22201D]">
            {seccion.titulo}
          </h1>

          <p className="mt-1 text-sm text-[#6F695E]">
            {seccion.descripcion}
          </p>
        </div>

        {seccion.id === "usuarios" && (
          <p className="text-sm text-[#6F695E]">
            <span className="font-semibold tabular-nums text-[#22201D]">
              {cantidadUsuarios}
            </span>{" "}
            usuarios registrados
          </p>
        )}
      </div>
    </header>
  );
}

"use client";

import { Search, Settings2, Store, Users, Palette } from "lucide-react";
import { useMemo, useState } from "react";

import type { SeccionConfiguracion, SeccionId } from "../types/configuracion";

export const seccionesConfiguracion: SeccionConfiguracion[] = [
  {
    id: "datos",
    grupo: "Restaurante",
    titulo: "Datos del restaurante",
    descripcion: "Nombre y datos de contacto",
    icono: Store,
  },
  {
    id: "operacion",
    grupo: "Restaurante",
    titulo: "Operación",
    descripcion: "Alertas y actualización de cocina",
    icono: Settings2,
  },
  {
    id: "usuarios",
    grupo: "Equipo",
    titulo: "Usuarios y accesos",
    descripcion: "Empleados, roles y PIN",
    icono: Users,
  },
  {
    id: "apariencia",
    grupo: "Sistema",
    titulo: "Apariencia",
    descripcion: "Tema y preferencias visuales",
    icono: Palette,
  },
];

type Props = {
  activa: SeccionId;
  onSeleccionar: (id: SeccionId) => void;
};

export function ConfiguracionSidebar({ activa, onSeleccionar }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const seccionesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return seccionesConfiguracion.filter((seccion) =>
      `${seccion.grupo} ${seccion.titulo} ${seccion.descripcion}`
        .toLowerCase()
        .includes(termino),
    );
  }, [busqueda]);

  const grupos = [
    ...new Set(seccionesFiltradas.map((seccion) => seccion.grupo)),
  ];

  return (
    <aside className="min-w-0 bg-white px-4 py-5 lg:border-r lg:border-[#E7E1D7] lg:px-5">
      <h2 className="text-sm font-semibold text-[#22201D]">Configuración</h2>

      <label className="relative mt-4 block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6F695E]"
          aria-hidden="true"
        />

        <input
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar configuración"
          aria-label="Buscar configuración"
          className="h-10 w-full rounded-lg border border-[#E7E1D7] bg-transparent pl-9 pr-3 text-sm text-[#22201D] outline-none transition placeholder:text-[#6F695E] focus:border-[#C85C3D] focus:ring-2 focus:ring-[#C85C3D]/15"
        />
      </label>

      <nav aria-label="Secciones de configuración" className="mt-5 space-y-6">
        {grupos.map((grupo) => (
          <div key={grupo}>
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6F695E]">
              {grupo}
            </p>

            <ul className="space-y-1">
              {seccionesFiltradas
                .filter((seccion) => seccion.grupo === grupo)
                .map((seccion) => {
                  const Icono = seccion.icono;
                  const seleccionada = seccion.id === activa;

                  return (
                    <li key={seccion.id}>
                      <button
                        type="button"
                        onClick={() => onSeleccionar(seccion.id)}
                        aria-current={seleccionada ? "page" : undefined}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                          seleccionada
                            ? "bg-[#FFF0EA] text-[#A3402A]"
                            : "text-[#22201D] hover:bg-white"
                        }`}
                      >
                        <Icono
                          className="size-[18px] shrink-0"
                          aria-hidden="true"
                        />

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {seccion.titulo}
                          </span>

                          <span
                            className={`mt-0.5 block text-xs ${
                              seleccionada
                                ? "text-[#A3402A]/75"
                                : "text-[#6F695E]"
                            }`}
                          >
                            {seccion.descripcion}
                          </span>
                        </span>

                        <span aria-hidden="true" className="text-base">
                          ›
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}

        {seccionesFiltradas.length === 0 && (
          <p className="px-2 py-5 text-sm text-[#6F695E]">
            No hay secciones con ese nombre.
          </p>
        )}
      </nav>
    </aside>
  );
}

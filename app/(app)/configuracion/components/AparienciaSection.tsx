"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useThemePreference, type ThemePreference } from "@/components/theme/ThemeProvider";

const opciones: { id: ThemePreference; titulo: string; descripcion: string; icono: typeof Sun; muestra: string }[] = [
  { id: "light", titulo: "Claro", descripcion: "Apariencia luminosa para espacios bien iluminados.", icono: Sun, muestra: "bg-white" },
  { id: "dark", titulo: "Oscuro", descripcion: "Reduce el brillo y mantiene el contraste para turnos nocturnos.", icono: Moon, muestra: "bg-[#22201D]" },
  { id: "system", titulo: "Sistema", descripcion: "Sigue la preferencia de apariencia de este dispositivo.", icono: Monitor, muestra: "bg-gradient-to-r from-[#F8F6F1] to-[#17191D]" },
];

export function AparienciaSection() {
  const { preference, setPreference } = useThemePreference();

  return (
    <section className="max-w-5xl">
      <div>
        <h2 className="text-base font-semibold text-[#22201D]">Tema de la aplicación</h2>
        <p className="mt-1 text-sm text-[#6F695E]">Elige cómo se ve MrParrilla en este dispositivo.</p>
      </div>

      <fieldset className="mt-5 grid gap-3 md:grid-cols-3">
        <legend className="sr-only">Seleccionar tema</legend>
        {opciones.map((opcion) => {
          const Icono = opcion.icono;
          const seleccionada = preference === opcion.id;
          return (
            <label key={opcion.id} className={`relative cursor-pointer rounded-xl border p-4 transition ${seleccionada ? "border-[#C85C3D] bg-[#FFF0EA] ring-1 ring-[#C85C3D]/20" : "border-[#E7E1D7] bg-white hover:border-[#E7E1D7]"}`}>
              <input type="radio" name="tema" value={opcion.id} checked={seleccionada} onChange={() => setPreference(opcion.id)} className="sr-only" />
              <span className={`flex h-24 items-center justify-center rounded-lg border border-[#E7E1D7] ${opcion.muestra}`}>
                <Icono className={opcion.id === "dark" ? "size-7 text-white" : "size-7 text-[#A3402A]"} aria-hidden="true" />
              </span>
              <span className="mt-4 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#22201D]">{opcion.titulo}</span>
                {seleccionada && <Check className="size-4 text-[#A3402A]" aria-hidden="true" />}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#6F695E]">{opcion.descripcion}</span>
            </label>
          );
        })}
      </fieldset>

      <p className="mt-4 text-xs text-[#6F695E]">La preferencia se guarda en este navegador y se aplica a todos los módulos.</p>
    </section>
  );
}

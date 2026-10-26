
"use client";

import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";

import type { RolUsuario } from "../types/configuracion";

const roles: { value: RolUsuario; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "cajero", label: "Cajero" },
  { value: "mesero", label: "Mesero" },
  { value: "cocina", label: "Cocina" },
];

const fieldClass =
  "h-10 w-full rounded-lg border border-[#E7E1D7] bg-transparent px-3 text-sm text-[#22201D] outline-none transition placeholder:text-[#6F695E] focus:border-[#C85C3D] focus:ring-2 focus:ring-[#C85C3D]/15";

type Props = {
  guardando: boolean;
  onCrear: (
    event: FormEvent<HTMLFormElement>,
    datos: { nombre: string; rol: RolUsuario; telefono: string; pin: string },
  ) => Promise<boolean>;
};

export function UsuariosForm({ guardando, onCrear }: Props) {
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<RolUsuario>("mesero");
  const [telefono, setTelefono] = useState("");
  const [pin, setPin] = useState("");

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    const creado = await onCrear(event, { nombre, rol, telefono, pin });

    if (creado) {
      setNombre("");
      setRol("mesero");
      setTelefono("");
      setPin("");
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2">
        <UserPlus className="size-5 text-[#A3402A]" aria-hidden="true" />

        <h2 className="text-base font-semibold text-[#22201D]">
          Crear usuario
        </h2>
      </div>

      <p className="mt-1 text-sm text-[#6F695E]">
        Asigna un rol y un PIN inicial de 4 dígitos.
      </p>

      <form
        onSubmit={enviar}
        className="mt-4 grid gap-4 border-b border-[#E7E1D7] pb-6 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto] xl:items-end"
      >
        <label className="block text-sm font-medium text-[#22201D]">
          Nombre del empleado

          <input
            required
            minLength={2}
            maxLength={80}
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej. Camila Torres"
            className={`${fieldClass} mt-1.5`}
          />
        </label>

        <label className="block text-sm font-medium text-[#22201D]">
          Teléfono <span className="font-normal text-[#6F695E]">(opcional)</span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={15}
            value={telefono}
            onChange={(event) => setTelefono(event.target.value.replace(/\D/g, "").slice(0, 15))}
            placeholder="3001234567"
            className={`${fieldClass} mt-1.5`}
          />
        </label>

        <label className="block text-sm font-medium text-[#22201D]">
          Rol

          <select
            value={rol}
            onChange={(event) =>
              setRol(event.target.value as RolUsuario)
            }
            className={`${fieldClass} mt-1.5`}
          >
            {roles.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-[#22201D]">
          PIN inicial

          <input
            required
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            minLength={4}
            maxLength={4}
            autoComplete="new-password"
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="4 dígitos"
            className={`${fieldClass} mt-1.5 tracking-[0.3em]`}
          />
        </label>

        <button
          type="submit"
          disabled={guardando}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#A3402A] px-4 text-sm font-semibold text-white transition hover:bg-[#87351F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="size-4" aria-hidden="true" />
          )}

          Crear usuario
        </button>
      </form>
    </section>
  );
}

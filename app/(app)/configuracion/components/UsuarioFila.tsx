
"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";

import type {
  RolUsuario,
  UsuarioAdmin,
} from "../types/configuracion";

const roles: { value: RolUsuario; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "cajero", label: "Cajero" },
  { value: "mesero", label: "Mesero" },
  { value: "cocina", label: "Cocina" },
];

const fieldClass =
  "h-10 w-full rounded-lg border border-[#E7E1D7] bg-transparent px-3 text-sm text-[#22201D] outline-none transition focus:border-[#C85C3D] focus:ring-2 focus:ring-[#C85C3D]/15";

type Props = {
  usuario: UsuarioAdmin;
  esActual: boolean;
  guardando: boolean;
  onCambiar: (id: string, cambios: Partial<UsuarioAdmin>) => void;
  onGuardar: (usuario: UsuarioAdmin) => Promise<void>;
  onRestablecerPin: (
    event: FormEvent<HTMLFormElement>,
    usuario: UsuarioAdmin,
    pin: string,
  ) => Promise<boolean>;
};

export function UsuarioFila({
  usuario,
  esActual,
  guardando,
  onCambiar,
  onGuardar,
  onRestablecerPin,
}: Props) {
  const [mostrarPin, setMostrarPin] = useState(false);
  const [pinNuevo, setPinNuevo] = useState("");

  const bloqueado =
    usuario.bloqueado_hasta !== null &&
    new Date(usuario.bloqueado_hasta) > new Date();

  const guardarPin = async (event: FormEvent<HTMLFormElement>) => {
    const restablecido = await onRestablecerPin(
      event,
      usuario,
      pinNuevo,
    );

    if (restablecido) {
      setPinNuevo("");
      setMostrarPin(false);
    }
  };

  return (
    <li className="py-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(10rem,1fr)_minmax(10rem,0.8fr)_minmax(9rem,0.8fr)_auto_auto] xl:items-end">
        <label className="block text-xs font-medium text-[#6F695E]">
          Nombre {esActual && <span className="text-[#6F695E]">(tú)</span>}

          <input
            value={usuario.nombre}
            onChange={(event) =>
              onCambiar(usuario.id, { nombre: event.target.value })
            }
            className={`${fieldClass} mt-1`}
          />
        </label>

        <label className="block text-xs font-medium text-[#6F695E]">
          Teléfono
          <input
            type="tel"
            inputMode="numeric"
            maxLength={15}
            value={usuario.telefono}
            onChange={(event) =>
              onCambiar(usuario.id, {
                telefono: event.target.value.replace(/\D/g, "").slice(0, 15),
              })
            }
            placeholder="Sin registrar"
            className={`${fieldClass} mt-1`}
          />
        </label>

        <label className="block text-xs font-medium text-[#6F695E]">
          Rol

          <select
            value={usuario.rol}
            onChange={(event) =>
              onCambiar(usuario.id, {
                rol: event.target.value as RolUsuario,
              })
            }
            className={`${fieldClass} mt-1`}
          >
            {roles.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex h-10 items-center gap-2 text-sm text-[#22201D]">
          <input
            type="checkbox"
            checked={usuario.activo}
            onChange={(event) =>
              onCambiar(usuario.id, { activo: event.target.checked })
            }
            className="size-4 accent-[#3D8060]"
          />

          {usuario.activo ? "Activo" : "Desactivado"}
        </label>

        <button
          type="button"
          onClick={() => void onGuardar(usuario)}
          disabled={
            guardando ||
            !usuario.nombre.trim() ||
            (esActual && (!usuario.activo || usuario.rol !== "admin"))
          }
          className="h-10 rounded-lg border border-[#E7E1D7] px-4 text-sm font-medium text-[#22201D] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Guardar cambios
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6F695E]">
          <span>Creado {new Date(usuario.creado_en).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</span>
          <span>
          {bloqueado
            ? `Acceso bloqueado hasta ${new Date(
                usuario.bloqueado_hasta!,
              ).toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : usuario.intentos_fallidos > 0
              ? `${usuario.intentos_fallidos} intentos fallidos`
              : "Sin bloqueos de acceso"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setMostrarPin((actual) => !actual);
            setPinNuevo("");
          }}
          className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[#A3402A] transition hover:bg-[#FFF0EA]"
        >
          <KeyRound className="size-4" aria-hidden="true" />
          {mostrarPin ? "Cancelar PIN" : "Restablecer PIN"}
        </button>
      </div>

      {mostrarPin && (
        <form
          onSubmit={guardarPin}
          className="mt-3 flex flex-col gap-3 border-l-2 border-[#E7E1D7] pl-4 sm:flex-row sm:items-end"
        >
          <label className="block flex-1 text-xs font-medium text-[#6F695E]">
            Nuevo PIN para {usuario.nombre}

            <input
              required
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              minLength={4}
              maxLength={4}
              autoComplete="new-password"
              value={pinNuevo}
              onChange={(event) =>
                setPinNuevo(
                  event.target.value.replace(/\D/g, "").slice(0, 4),
                )
              }
              placeholder="4 dígitos"
              className={`${fieldClass} mt-1`}
            />
          </label>

          <button
            type="submit"
            disabled={guardando}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#22201D] px-4 text-sm font-medium text-white transition hover:bg-[#22201D] disabled:opacity-60"
          >
            {guardando && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Guardar PIN
          </button>
        </form>
      )}
    </li>
  );
}

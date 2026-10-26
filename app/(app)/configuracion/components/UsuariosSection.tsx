
"use client";

import { ShieldCheck } from "lucide-react";

import { UsuariosForm } from "./CrearUsuarioForm"
import { UsuarioFila } from "./UsuarioFila";

import type { FormEvent } from "react";
import type { UsuarioAdmin } from "../types/configuracion";

type Props = {
  usuarios: UsuarioAdmin[];
  usuarioActualId: string;
  guardando: boolean;
  onCrear: (
    event: FormEvent<HTMLFormElement>,
    datos: {
      nombre: string;
      rol: UsuarioAdmin["rol"];
      telefono: string;
      pin: string;
    },
  ) => Promise<boolean>;
  onCambiar: (
    id: string,
    cambios: Partial<UsuarioAdmin>,
  ) => void;
  onGuardar: (usuario: UsuarioAdmin) => Promise<void>;
  onRestablecerPin: (
    event: FormEvent<HTMLFormElement>,
    usuario: UsuarioAdmin,
    pin: string,
  ) => Promise<boolean>;
};

export function UsuariosSection({
  usuarios,
  usuarioActualId,
  guardando,
  onCrear,
  onCambiar,
  onGuardar,
  onRestablecerPin,
}: Props) {
  return (
    <div className="space-y-8">
      <UsuariosForm guardando={guardando} onCrear={onCrear} />

      <section>
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 size-5 text-[#2E6B4F]"
            aria-hidden="true"
          />

          <div>
            <h2 className="text-base font-semibold text-[#22201D]">
              Usuarios y accesos
            </h2>

            <p className="mt-1 text-sm text-[#6F695E]">
              Cambia roles, suspende accesos o restablece un PIN.
            </p>
          </div>
        </div>

        {usuarios.length === 0 ? (
          <p className="py-10 text-sm text-[#6F695E]">
            Todavía no hay usuarios registrados.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[#E7E1D7]">
            {usuarios.map((usuario) => (
              <UsuarioFila
                key={usuario.id}
                usuario={usuario}
                esActual={usuario.id === usuarioActualId}
                guardando={guardando}
                onCambiar={onCambiar}
                onGuardar={onGuardar}
                onRestablecerPin={onRestablecerPin}
              />
            ))}
          </ul>
        )}

        <p className="mt-5 text-xs leading-5 text-[#6F695E]">
          Los PIN se protegen con un hash seguro y el sistema nunca los
          vuelve a mostrar. Para suspender una cuenta, desactívala; así
          se conserva su historial.
        </p>
      </section>
    </div>
  );
}

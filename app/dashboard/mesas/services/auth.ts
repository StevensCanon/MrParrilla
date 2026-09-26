import { supabase } from "@/lib/supabaseClient";
import type { RolUsuario } from "../types/types";

const ROLES_VALIDOS: RolUsuario[] = [
  "admin",
  "mesero",
  "cocinero",
  "cajero",
];

export type UsuarioAutenticado = {
  id: string;
  rol: RolUsuario | null;
};

export async function obtenerUsuarioAutenticado(): Promise<UsuarioAutenticado | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: rol, error } = await supabase.rpc("rol_actual");

  if (error) {
    return { id: user.id, rol: null };
  }

  const rolNormalizado = String(rol ?? "")
    .trim()
    .toLowerCase();

  return {
    id: user.id,
    rol: ROLES_VALIDOS.includes(rolNormalizado as RolUsuario)
      ? (rolNormalizado as RolUsuario)
      : null,
  };
}

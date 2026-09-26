import { supabase } from "@/lib/supabaseClient";
import type { RolUsuario } from "../types/types";

const ROLES_VALIDOS: RolUsuario[] = [
  "admin",
  "mesero",
  "cocinero",
  "cajero",
];

export async function obtenerRolUsuario(): Promise<RolUsuario | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: rol, error } = await supabase.rpc("rol_actual");

  if (error) {
    return null;
  }

  const rolNormalizado = String(rol ?? "")
    .trim()
    .toLowerCase();

  return ROLES_VALIDOS.includes(rolNormalizado as RolUsuario)
    ? (rolNormalizado as RolUsuario)
    : null;
}

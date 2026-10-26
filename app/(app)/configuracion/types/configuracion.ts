
import type { LucideIcon } from "lucide-react";

export type RolUsuario = "admin" | "cajero" | "mesero" | "cocina";

export type UsuarioAdmin = {
  id: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  telefono: string;
  creado_en: string;
  intentos_fallidos: number;
  bloqueado_hasta: string | null;
};

export type ConfiguracionRestaurante = {
  nombre: string;
  nit: string;
  telefono: string;
  correo: string;
  direccion: string;
  umbral_demora_minutos: number;
  intervalo_actualizacion_segundos: number;
};

export const configuracionRestauranteInicial: ConfiguracionRestaurante = {
  nombre: "MrParrilla",
  nit: "",
  telefono: "",
  correo: "",
  direccion: "",
  umbral_demora_minutos: 15,
  intervalo_actualizacion_segundos: 10,
};

export type SeccionId =
  | "datos"
  | "operacion"
  | "usuarios"
  | "apariencia";

export type GrupoConfiguracion = "Restaurante" | "Equipo" | "Sistema";

export type SeccionConfiguracion = {
  id: SeccionId;
  grupo: GrupoConfiguracion;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
};

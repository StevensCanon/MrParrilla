"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  configuracionRestauranteInicial,
  type ConfiguracionRestaurante,
} from "../types/configuracion";

type EstadoConfiguracion = {
  configuracion: ConfiguracionRestaurante;
  cargando: boolean;
  guardando: boolean;
  error: string;
  mensaje: string;
};

async function invocar(accion: string, payload?: Partial<ConfiguracionRestaurante>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");

  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { accion, ...payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error || data?.error) {
    let mensaje = data?.error as string | undefined;
    const response = (error as { context?: unknown } | null)?.context;
    if (!mensaje && response instanceof Response) {
      const body = await response.clone().json().catch(() => null);
      if (typeof body === "object" && body !== null && "error" in body && typeof body.error === "string") {
        mensaje = body.error;
      }
    }
    throw new Error(mensaje ?? error?.message ?? "No se pudo guardar la configuración.");
  }
  return data;
}

export function useConfiguracionRestaurante() {
  const [estado, setEstado] = useState<EstadoConfiguracion>({
    configuracion: configuracionRestauranteInicial,
    cargando: true,
    guardando: false,
    error: "",
    mensaje: "",
  });

  useEffect(() => {
    let cancelado = false;
    void invocar("configuracion_obtener")
      .then((respuesta) => {
        if (!cancelado && respuesta.configuracion) {
          setEstado((actual) => ({
            ...actual,
            configuracion: {
              ...configuracionRestauranteInicial,
              ...respuesta.configuracion,
              nit: respuesta.configuracion.nit ?? "",
              telefono: respuesta.configuracion.telefono ?? "",
              correo: respuesta.configuracion.correo ?? "",
              direccion: respuesta.configuracion.direccion ?? "",
            },
            error: "",
          }));
        }
      })
      .catch((error: unknown) => {
        if (!cancelado) {
          setEstado((actual) => ({
            ...actual,
            error: error instanceof Error ? error.message : "No se pudo cargar la configuración.",
          }));
        }
      })
      .finally(() => {
        if (!cancelado) setEstado((actual) => ({ ...actual, cargando: false }));
      });

    return () => { cancelado = true; };
  }, []);

  const cambiarCampo = <K extends keyof ConfiguracionRestaurante>(
    campo: K,
    valor: ConfiguracionRestaurante[K],
  ) => {
    setEstado((actual) => ({
      ...actual,
      error: "",
      mensaje: "",
      configuracion: { ...actual.configuracion, [campo]: valor },
    }));
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEstado((actual) => ({ ...actual, guardando: true, error: "", mensaje: "" }));
    try {
      await invocar("configuracion_guardar", estado.configuracion);
      setEstado((actual) => ({ ...actual, mensaje: "Cambios guardados." }));
      return true;
    } catch (error) {
      setEstado((actual) => ({
        ...actual,
        error: error instanceof Error ? error.message : "No se pudo guardar la configuración.",
      }));
      return false;
    } finally {
      setEstado((actual) => ({ ...actual, guardando: false }));
    }
  };

  return { ...estado, cambiarCampo, guardar };
}

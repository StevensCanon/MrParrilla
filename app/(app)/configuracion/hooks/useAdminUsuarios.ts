
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";
import type { RolUsuario, UsuarioAdmin } from "../types/configuracion";

type RespuestaAdmin = {
  error?: string;
  usuarios?: UsuarioAdmin[];
};

export function useAdminUsuarios() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [usuarioActualId, setUsuarioActualId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const invocar = useCallback(
    async (payload: Record<string, unknown>): Promise<RespuestaAdmin> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
      }

      const { data, error: functionError } =
        await supabase.functions.invoke("admin-users", {
          body: payload,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

      if (functionError || data?.error) {
        let mensajeError: string | undefined = data?.error;

        const respuesta = (
          functionError as { context?: unknown } | null
        )?.context;

        if (!mensajeError && respuesta instanceof Response) {
          const cuerpo: unknown = await respuesta
            .clone()
            .json()
            .catch(() => null);

          if (
            typeof cuerpo === "object" &&
            cuerpo !== null &&
            "error" in cuerpo &&
            typeof cuerpo.error === "string"
          ) {
            mensajeError = cuerpo.error;
          }
        }

        throw new Error(
          mensajeError ??
            functionError?.message ??
            "No se pudo completar la acción.",
        );
      }

      return data as RespuestaAdmin;
    },
    [router],
  );

  const cargarUsuarios = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) setCargando(true);

      setError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        setUsuarioActualId(user.id);

        const { data: perfil, error: perfilError } = await supabase
          .from("usuarios")
          .select("rol")
          .eq("id", user.id)
          .single();

        if (perfilError || perfil?.rol !== "admin") {
          router.replace("/dashboard");
          return;
        }

        const resultado = await invocar({ accion: "listar" });

        setUsuarios(resultado.usuarios ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los usuarios.",
        );
      } finally {
        if (mostrarCarga) setCargando(false);
      }
    },
    [invocar, router],
  );

  useEffect(() => {
    void cargarUsuarios();
  }, [cargarUsuarios]);

  const crearUsuario = async (
    event: FormEvent<HTMLFormElement>,
    datos: { nombre: string; rol: RolUsuario; telefono: string; pin: string },
  ) => {
    event.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await invocar({
        accion: "crear",
        ...datos,
      });

      setMensaje(
        "Usuario creado. Comparte el PIN inicial de forma privada.",
      );

      await cargarUsuarios(false);

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear el usuario.",
      );
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const actualizarUsuario = async (usuario: UsuarioAdmin) => {
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await invocar({
        accion: "actualizar",
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        activo: usuario.activo,
        telefono: usuario.telefono,
      });

      setMensaje(`Cambios guardados para ${usuario.nombre}.`);
      await cargarUsuarios(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el usuario.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const restablecerPin = async (
    event: FormEvent<HTMLFormElement>,
    usuario: UsuarioAdmin,
    pin: string,
  ) => {
    event.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await invocar({
        accion: "restablecer_pin",
        id: usuario.id,
        pin,
      });

      setMensaje(
        `PIN restablecido para ${usuario.nombre}. Compártelo de forma privada.`,
      );

      await cargarUsuarios(false);

      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo restablecer el PIN.",
      );
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const cambiarCampoUsuario = (
    id: string,
    cambios: Partial<UsuarioAdmin>,
  ) => {
    setUsuarios((actuales) =>
      actuales.map((usuario) =>
        usuario.id === id ? { ...usuario, ...cambios } : usuario,
      ),
    );
  };

  return {
    usuarios,
    usuarioActualId,
    cargando,
    guardando,
    error,
    mensaje,
    setError,
    setMensaje,
    cargarUsuarios,
    crearUsuario,
    actualizarUsuario,
    restablecerPin,
    cambiarCampoUsuario,
  };
}

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";

import {
  actualizarDisponibilidadPlato,
  actualizarPlato,
  crearPlato,
  eliminarPlato,
  obtenerPlatos,
} from "../libs/libs";

import { FORMULARIO_INICIAL } from "../constants/constants";

import type {
  FormularioPlato,
  Plato,
} from "../types/types";

export function usePlatos() {
  const router = useRouter();

  const [platos, setPlatos] = useState<Plato[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioPlato>(FORMULARIO_INICIAL);

  const [platoEditando, setPlatoEditando] =
    useState<Plato | null>(null);

  const [dialogoAbierto, setDialogoAbierto] =
    useState(false);

  const verificarSesion = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return false;
    }

    return true;
  }, [router]);

  const cargarPlatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const sesionValida = await verificarSesion();

      if (!sesionValida) {
        return;
      }

      const datos = await obtenerPlatos();

      setPlatos(datos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la información de los platos.",
      );
    } finally {
      setLoading(false);
    }
  }, [verificarSesion]);

  const abrirCrear = useCallback(() => {
    setPlatoEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setError(null);
    setDialogoAbierto(true);
  }, []);

  const abrirEditar = useCallback((plato: Plato) => {
    setPlatoEditando(plato);

    setFormulario({
      nombre: plato.nombre,
      categoria: plato.categoria,
      precio: String(plato.precio),
      disponible: plato.disponible,
    });

    setError(null);
    setDialogoAbierto(true);
  }, []);

  const cerrarDialogo = useCallback(() => {
    if (guardando) {
      return;
    }

    setDialogoAbierto(false);
    setPlatoEditando(null);
    setFormulario(FORMULARIO_INICIAL);
  }, [guardando]);

  const guardar = useCallback(
    async (): Promise<boolean> => {
      setError(null);

      const nombre = formulario.nombre.trim();

      if (!nombre) {
        setError("El nombre del plato es obligatorio.");
        return false;
      }

      if (!formulario.categoria) {
        setError("Selecciona una categoría.");
        return false;
      }

      const precio = Number(formulario.precio);

      if (
        formulario.precio.trim() === "" ||
        Number.isNaN(precio) ||
        precio < 0
      ) {
        setError("El precio no es válido.");
        return false;
      }

      const sesionValida = await verificarSesion();

      if (!sesionValida) {
        return false;
      }

      setGuardando(true);

      try {
        const datos = {
          ...formulario,
          nombre,
          precio: String(precio),
        };

        if (platoEditando) {
          await actualizarPlato(
            platoEditando.id,
            datos,
          );
        } else {
          await crearPlato(datos);
        }

        const platosActualizados =
          await obtenerPlatos();

        setPlatos(platosActualizados);

        setDialogoAbierto(false);
        setPlatoEditando(null);
        setFormulario(FORMULARIO_INICIAL);

        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error al guardar el plato.",
        );

        return false;
      } finally {
        setGuardando(false);
      }
    },
    [
      formulario,
      platoEditando,
      verificarSesion,
    ],
  );

  const cambiarDisponibilidad = useCallback(
    async (plato: Plato): Promise<boolean> => {
      setError(null);

      const sesionValida =
        await verificarSesion();

      if (!sesionValida) {
        return false;
      }

      const nuevaDisponibilidad =
        !plato.disponible;

      try {
        await actualizarDisponibilidadPlato(
          plato.id,
          nuevaDisponibilidad,
        );

        setPlatos((actuales) =>
          actuales.map((actual) =>
            actual.id === plato.id
              ? {
                  ...actual,
                  disponible:
                    nuevaDisponibilidad,
                }
              : actual,
          ),
        );

        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cambiar la disponibilidad.",
        );

        return false;
      }
    },
    [verificarSesion],
  );

  const eliminar = useCallback(
    async (plato: Plato): Promise<boolean> => {
      setError(null);

      const sesionValida =
        await verificarSesion();

      if (!sesionValida) {
        return false;
      }

      try {
        await eliminarPlato(plato.id);

        setPlatos((actuales) =>
          actuales.filter(
            (actual) => actual.id !== plato.id,
          ),
        );

        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo eliminar el plato.",
        );

        return false;
      }
    },
    [verificarSesion],
  );

  return {
    platos,
    loading,
    guardando,
    error,
    setError,

    formulario,
    setFormulario,

    platoEditando,

    dialogoAbierto,
    setDialogoAbierto,

    cargarPlatos,

    abrirCrear,
    abrirEditar,
    cerrarDialogo,

    guardar,
    cambiarDisponibilidad,
    eliminar,
  };
}
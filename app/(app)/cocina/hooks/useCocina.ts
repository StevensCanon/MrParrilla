import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  archivarComanda,
  actualizarEstadoItem,
  cargarComandasCocina,
} from "../libs/libs";
import { INTERVALO_ACTUALIZACION } from "../constants/constants";
import { obtenerTipoComanda, ordenarPorAntiguedad } from "../utils/utils";
import type { ComandaCocina } from "../types/types";

export function useCocina() {
  const router = useRouter();
  const [comandas, setComandas] = useState<ComandaCocina[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accionando, setAccionando] = useState<string | null>(null);
  const cargandoDatos = useRef(false);

  const cargar = useCallback(
    async (mostrarLoading = false) => {
      // El ref evita refrescos simultáneos sin cambiar la identidad de `cargar`.
      if (cargandoDatos.current) return;
      cargandoDatos.current = true;

      try {
        if (mostrarLoading) setLoading(true);
        else setActualizando(true);

        setError(null);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setComandas(await cargarComandasCocina());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar las comandas.",
        );
      } finally {
        if (mostrarLoading) setLoading(false);
        else setActualizando(false);
        cargandoDatos.current = false;
      }
    },
    [router],
  );

  useEffect(() => {
    void cargar(true);
  }, [cargar]);

  useEffect(() => {
    const intervalo = window.setInterval(() => void cargar(), INTERVALO_ACTUALIZACION);
    return () => window.clearInterval(intervalo);
  }, [cargar]);

  const actualizar = useCallback(() => {
    if (!actualizando) void cargar();
  }, [actualizando, cargar]);

  const cambiarEstadoItem = useCallback(
    async (itemId: string, nuevoEstado: "preparando" | "listo") => {
      try {
        setAccionando(itemId);
        setError(null);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        await actualizarEstadoItem(itemId, nuevoEstado);
        await cargar();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible actualizar el estado.",
        );
      } finally {
        setAccionando(null);
      }
    },
    [cargar, router],
  );

  const archivar = useCallback(
    async (comandaId: string) => {
      try {
        setAccionando(comandaId);
        setError(null);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        await archivarComanda(comandaId);
        await cargar();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible archivar la comanda.",
        );
      } finally {
        setAccionando(null);
      }
    },
    [cargar, router],
  );

  const comandasPendientes = useMemo(
    () =>
      ordenarPorAntiguedad(
        comandas.filter((comanda) => obtenerTipoComanda(comanda) === "pendiente"),
      ),
    [comandas],
  );
  const comandasPreparando = useMemo(
    () =>
      ordenarPorAntiguedad(
        comandas.filter((comanda) => obtenerTipoComanda(comanda) === "preparando"),
      ),
    [comandas],
  );
  const comandasListas = useMemo(
    () =>
      ordenarPorAntiguedad(
        comandas.filter((comanda) => obtenerTipoComanda(comanda) === "listo"),
      ),
    [comandas],
  );

  return {
    comandas,
    comandasPendientes,
    comandasPreparando,
    comandasListas,
    loading,
    actualizando,
    error,
    accionando,
    actualizar,
    cambiarEstadoItem,
    archivarComanda: archivar,
  };
}

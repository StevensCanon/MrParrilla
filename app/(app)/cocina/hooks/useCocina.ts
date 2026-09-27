import {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import { useRouter } from "next/navigation";
  
  import { supabase } from "@/lib/supabaseClient";
  
  import {
    archivarComanda,
    actualizarEstadoItem,
    cargarComandasCocina,
  } from "../libs/libs";
  
  import {
    INTERVALO_ACTUALIZACION,
  } from "../constants/constants";
  
  import {
    obtenerTipoComanda,
    ordenarPorAntiguedad,
  } from "../utils/utils";
  
  import type {
    ComandaCocina,
  } from "../types/types";
  
  export function useCocina() {
    const router = useRouter();
  
    const [comandas, setComandas] = useState<
      ComandaCocina[]
    >([]);
  
    const [loading, setLoading] =
      useState(true);
  
    const [actualizando, setActualizando] =
      useState(false);
  
    const [error, setError] =
      useState<string | null>(null);
  
    const [accionando, setAccionando] =
      useState<string | null>(null);
  
    const cargar = useCallback(
      async (mostrarLoading = false) => {
        try {
          if (mostrarLoading) {
            setLoading(true);
          } else {
            setActualizando(true);
          }
  
          setError(null);
  
          const {
            data: { user },
          } = await supabase.auth.getUser();
  
          if (!user) {
            router.push("/login");
            return;
          }
  
          const resultado =
            await cargarComandasCocina();
  
          setComandas(resultado);
        } catch (err) {
          const mensaje =
            err instanceof Error
              ? err.message
              : "No fue posible cargar las comandas.";
  
          setError(mensaje);
        } finally {
          if (mostrarLoading) {
            setLoading(false);
          } else {
            setActualizando(false);
          }
        }
      },
      [router],
    );
  
    /*
     * Carga inicial.
     *
     * Usamos una función asíncrona separada para que el efecto
     * únicamente sincronice la página con la fuente externa
     * (Supabase) y no llame directamente a setState.
     */
    useEffect(() => {
      let activo = true;
  
      const cargarInicial = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
  
          if (!activo) {
            return;
          }
  
          if (!user) {
            router.push("/login");
            return;
          }
  
          const resultado =
            await cargarComandasCocina();
  
          if (!activo) {
            return;
          }
  
          setComandas(resultado);
          setError(null);
          setLoading(false);
        } catch (err) {
          if (!activo) {
            return;
          }
  
          const mensaje =
            err instanceof Error
              ? err.message
              : "No fue posible cargar las comandas.";
  
          setError(mensaje);
          setLoading(false);
        }
      };
  
      void cargarInicial();
  
      return () => {
        activo = false;
      };
    }, [router]);
  
    /*
     * Actualización automática cada 10 segundos.
     */
    useEffect(() => {
      const intervalo = window.setInterval(() => {
        void cargar(false);
      }, INTERVALO_ACTUALIZACION);
  
      return () => {
        window.clearInterval(intervalo);
      };
    }, [cargar]);
  
    const actualizar = useCallback(() => {
      if (actualizando) {
        return;
      }
  
      void cargar(false);
    }, [actualizando, cargar]);
  
    const cambiarEstadoItem = useCallback(
      async (
        itemId: string,
        nuevoEstado:
          | "preparando"
          | "listo",
      ) => {
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
  
          await actualizarEstadoItem(
            itemId,
            nuevoEstado,
          );
  
          await cargar(false);
        } catch (err) {
          const mensaje =
            err instanceof Error
              ? err.message
              : "No fue posible actualizar el estado.";
  
          setError(mensaje);
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
  
          await cargar(false);
        } catch (err) {
          const mensaje =
            err instanceof Error
              ? err.message
              : "No fue posible archivar la comanda.";
  
          setError(mensaje);
        } finally {
          setAccionando(null);
        }
      },
      [cargar, router],
    );
  
    const comandasPendientes = useMemo(
      () =>
        ordenarPorAntiguedad(
          comandas.filter(
            (comanda) =>
              obtenerTipoComanda(comanda) ===
              "pendiente",
          ),
        ),
      [comandas],
    );
  
    const comandasPreparando = useMemo(
      () =>
        ordenarPorAntiguedad(
          comandas.filter(
            (comanda) =>
              obtenerTipoComanda(comanda) ===
              "preparando",
          ),
        ),
      [comandas],
    );
  
    const comandasListas = useMemo(
      () =>
        ordenarPorAntiguedad(
          comandas.filter(
            (comanda) =>
              obtenerTipoComanda(comanda) ===
              "listo",
          ),
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
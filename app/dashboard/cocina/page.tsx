"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Clock3,
  Loader2,
  RefreshCw,
  Check,
  Play,
  Utensils,
  AlertCircle,
} from "lucide-react";

import { createAuthedClient } from "@/lib/supabaseClient";

type Comanda = {
  id: string;
  canal: string;
  mesa_id: string | null;
  mesero_id: string | null;
  estado: string;
  abierta_en: string;
};

type ComandaItem = {
  id: string;
  comanda_id: string;
  plato_id: string;
  cantidad: number;
  observaciones: string | null;
  precio_unitario: number;
  estado: string;
};

type Mesa = {
  id: string;
  nombre: string;
};

type Plato = {
  id: string;
  nombre: string;
  categoria: string;
};

type ItemCocina = ComandaItem & {
  plato: Plato | null;
};

type ComandaCocina = Comanda & {
  mesa: Mesa | null;
  items: ItemCocina[];
};

const formatearHora = (fecha: string) => {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
};

const tiempoTranscurrido = (fecha: string) => {
  const inicio = new Date(fecha).getTime();
  const ahora = Date.now();

  const minutos = Math.max(
    0,
    Math.floor((ahora - inicio) / 60000),
  );

  if (minutos < 1) {
    return "Hace menos de 1 min";
  }

  if (minutos === 1) {
    return "Hace 1 min";
  }

  if (minutos < 60) {
    return `Hace ${minutos} min`;
  }

  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (minutosRestantes === 0) {
    return `Hace ${horas} h`;
  }

  return `Hace ${horas} h ${minutosRestantes} min`;
};

export default function CocinaPage() {
  const router = useRouter();

  // ============================================================
  // DATOS
  // ============================================================

  const [comandas, setComandas] = useState<
    ComandaCocina[]
  >([]);

  // ============================================================
  // ESTADOS
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [accionando, setAccionando] =
    useState<string | null>(null);

  // ============================================================
  // TOKEN
  // ============================================================

  const obtenerToken = useCallback(() => {
    const sesionGuardada =
      sessionStorage.getItem("sesion");

    if (!sesionGuardada) {
      router.push("/login");
      return null;
    }

    try {
      const sesion =
        JSON.parse(sesionGuardada);

      if (!sesion?.token) {
        sessionStorage.removeItem("sesion");
        router.push("/login");
        return null;
      }

      return sesion.token as string;
    } catch {
      sessionStorage.removeItem("sesion");
      router.push("/login");
      return null;
    }
  }, [router]);

  // ============================================================
  // CARGAR COMANDAS
  // ============================================================

  const cargarComandas = useCallback(
    async (mostrarLoading = false) => {
      if (mostrarLoading) {
        setLoading(true);
      }

      setError(null);

      const token = obtenerToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const supabase =
          createAuthedClient(token);

        // ------------------------------------------------------
        // COMANDAS ABIERTAS
        // ------------------------------------------------------

        const {
          data: comandasData,
          error: comandasError,
        } = await supabase
          .from("comandas")
          .select(
            "id, canal, mesa_id, mesero_id, estado, abierta_en",
          )
          .eq("estado", "abierta")
          .order("abierta_en", {
            ascending: true,
          });

        if (comandasError) {
          throw new Error(
            comandasError.message,
          );
        }

        const comandasBase =
          (comandasData as Comanda[]) ?? [];

        if (comandasBase.length === 0) {
          setComandas([]);
          return;
        }

        // ------------------------------------------------------
        // IDS DE MESAS
        // ------------------------------------------------------

        const mesaIds = Array.from(
          new Set(
            comandasBase
              .map(
                (comanda) =>
                  comanda.mesa_id,
              )
              .filter(
                (
                  id,
                ): id is string =>
                  Boolean(id),
              ),
          ),
        );

        // ------------------------------------------------------
        // MESAS
        // ------------------------------------------------------

        let mesasData: Mesa[] = [];

        if (mesaIds.length > 0) {
          const {
            data,
            error,
          } = await supabase
            .from("mesas")
            .select("id, nombre")
            .in("id", mesaIds);

          if (error) {
            throw new Error(
              error.message,
            );
          }

          mesasData =
            (data as Mesa[]) ?? [];
        }

        // ------------------------------------------------------
        // COMANDA ITEMS
        // ------------------------------------------------------

        const comandaIds =
          comandasBase.map(
            (comanda) => comanda.id,
          );

        const {
          data: itemsData,
          error: itemsError,
        } = await supabase
          .from("comanda_items")
          .select(
            "id, comanda_id, plato_id, cantidad, observaciones, precio_unitario, estado",
          )
          .in(
            "comanda_id",
            comandaIds,
          )
          .order("creado_en", {
            ascending: true,
          });

        if (itemsError) {
          throw new Error(
            itemsError.message,
          );
        }

        const items =
          (itemsData as ComandaItem[]) ?? [];

        // ------------------------------------------------------
        // PLATOS
        // ------------------------------------------------------

        const platoIds = Array.from(
          new Set(
            items.map(
              (item) =>
                item.plato_id,
            ),
          ),
        );

        let platosData: Plato[] = [];

        if (platoIds.length > 0) {
          const {
            data,
            error,
          } = await supabase
            .from("platos")
            .select(
              "id, nombre, categoria",
            )
            .in(
              "id",
              platoIds,
            );

          if (error) {
            throw new Error(
              error.message,
            );
          }

          platosData =
            (data as Plato[]) ?? [];
        }

        // ------------------------------------------------------
        // MAPAS
        // ------------------------------------------------------

        const mesasMap =
          new Map(
            mesasData.map((mesa) => [
              mesa.id,
              mesa,
            ]),
          );

        const platosMap =
          new Map(
            platosData.map((plato) => [
              plato.id,
              plato,
            ]),
          );

        // ------------------------------------------------------
        // ARMAR ESTRUCTURA
        // ------------------------------------------------------

        const resultado: ComandaCocina[] =
          comandasBase.map(
            (comanda) => {
              const itemsComanda =
                items
                  .filter(
                    (item) =>
                      item.comanda_id ===
                      comanda.id,
                  )
                  .map((item) => ({
                    ...item,
                    plato:
                      platosMap.get(
                        item.plato_id,
                      ) ?? null,
                  }));

              return {
                ...comanda,
                mesa:
                  comanda.mesa_id
                    ? mesasMap.get(
                        comanda.mesa_id,
                      ) ?? null
                    : null,
                items: itemsComanda,
              };
            },
          );

        setComandas(resultado);
      } catch (err) {
        console.error(
          "Error cargando cocina:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las comandas.",
        );
      } finally {
        setLoading(false);
        setActualizando(false);
      }
    },
    [obtenerToken],
  );

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    void cargarComandas(true);
  }, [cargarComandas]);

  // ============================================================
  // ACTUALIZACIÓN AUTOMÁTICA
  // ============================================================

  useEffect(() => {
    const intervalo =
      window.setInterval(() => {
        void cargarComandas(false);
      }, 10000);

    return () => {
      window.clearInterval(
        intervalo,
      );
    };
  }, [cargarComandas]);

  // ============================================================
  // ACTUALIZAR MANUALMENTE
  // ============================================================

  const actualizar = async () => {
    if (actualizando) return;

    setActualizando(true);

    await cargarComandas(false);
  };

  // ============================================================
  // CAMBIAR ESTADO DEL ITEM
  // ============================================================

  const cambiarEstadoItem = async (
    itemId: string,
    nuevoEstado:
      | "preparando"
      | "listo",
  ) => {
    if (accionando) return;

    const token = obtenerToken();

    if (!token) return;

    setAccionando(itemId);
    setError(null);

    try {
      const supabase =
        createAuthedClient(token);

      const {
        error,
      } = await supabase
        .from("comanda_items")
        .update({
          estado: nuevoEstado,
        })
        .eq("id", itemId);

      if (error) {
        throw new Error(
          error.message,
        );
      }

      await cargarComandas(false);
    } catch (err) {
      console.error(
        "Error actualizando item:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el producto.",
      );
    } finally {
      setAccionando(null);
    }
  };

  // ============================================================
  // AGRUPACIÓN
  // ============================================================

  const comandasPendientes =
    useMemo(() => {
      return comandas.filter(
        (comanda) =>
          comanda.items.some(
            (item) =>
              item.estado ===
              "pendiente",
          ),
      );
    }, [comandas]);

  const comandasPreparando =
    useMemo(() => {
      return comandas.filter(
        (comanda) =>
          comanda.items.some(
            (item) =>
              item.estado ===
              "preparando",
          ),
      );
    }, [comandas]);

  const comandasListas =
    useMemo(() => {
      return comandas.filter(
        (comanda) =>
          comanda.items.length > 0 &&
          comanda.items.every(
            (item) =>
              item.estado ===
              "listo",
          ),
      );
    }, [comandas]);

  // ============================================================
  // RENDER ITEM
  // ============================================================

  const renderItem = (
    item: ItemCocina,
  ) => {
    const procesando =
      accionando === item.id;

    return (
      <div
        key={item.id}
        className="border-b border-[#E4DED3] py-4 last:border-0"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#22201D] text-sm font-semibold text-white">
                {item.cantidad}
              </span>

              <div className="min-w-0">
                <p className="font-medium text-[#22201D]">
                  {item.plato?.nombre ??
                    "Producto"}
                </p>

                {item.observaciones && (
                  <p className="mt-1 text-xs text-[#A3402A]">
                    {item.observaciones}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {item.estado ===
              "pendiente" && (
              <button
                type="button"
                disabled={procesando}
                onClick={() =>
                  void cambiarEstadoItem(
                    item.id,
                    "preparando",
                  )
                }
                className="flex items-center gap-2 rounded-md bg-[#22201D] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#3A3732] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {procesando ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Play size={14} />
                )}

                Preparar
              </button>
            )}

            {item.estado ===
              "preparando" && (
              <button
                type="button"
                disabled={procesando}
                onClick={() =>
                  void cambiarEstadoItem(
                    item.id,
                    "listo",
                  )
                }
                className="flex items-center gap-2 rounded-md bg-[#2E6B4F] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {procesando ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Check size={14} />
                )}

                Marcar listo
              </button>
            )}

            {item.estado ===
              "listo" && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#E8F1EC] px-3 py-1.5 text-xs font-medium text-[#2E6B4F]">
                <Check size={13} />
                Listo
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // CARD COMANDA
  // ============================================================

  const renderComanda = (
    comanda: ComandaCocina,
  ) => {
    const mesaNumero =
      comanda.mesa?.nombre?.replace(
        /^mesa\s*/i,
        "",
      ) ?? "Sin mesa";

    const pendientes =
      comanda.items.filter(
        (item) =>
          item.estado ===
          "pendiente",
      ).length;

    const preparando =
      comanda.items.filter(
        (item) =>
          item.estado ===
          "preparando",
      ).length;

    const listos =
      comanda.items.filter(
        (item) =>
          item.estado === "listo",
      ).length;

    return (
      <article
        key={comanda.id}
        className="overflow-hidden rounded-lg border border-[#E4DED3] bg-white shadow-sm"
      >
        {/* HEADER */}
        <div className="border-b border-[#E4DED3] bg-[#FAF8F4] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-[#8A8375]">
                  Mesa
                </span>

                <span className=" if text-2xl text-[#22201D]">
                  {mesaNumero}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-xs text-[#8A8375]">
                <span className="flex items-center gap-1.5">
                  <Clock3 size={13} />
                  {formatearHora(
                    comanda.abierta_en,
                  )}
                </span>

                <span>
                  {tiempoTranscurrido(
                    comanda.abierta_en,
                  )}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center rounded-full bg-[#F1EEEA] px-3 py-1 text-[11px] font-medium text-[#6F695E]">
                {comanda.items.length}{" "}
                {comanda.items.length ===
                1
                  ? "producto"
                  : "productos"}
              </span>
            </div>
          </div>

          {/* RESUMEN ESTADOS */}
          <div className="mt-4 flex flex-wrap gap-2">
            {pendientes > 0 && (
              <span className="rounded-full bg-[#FFF5F2] px-2.5 py-1 text-[11px] font-medium text-[#A3402A]">
                {pendientes} pendiente
                {pendientes !== 1
                  ? "s"
                  : ""}
              </span>
            )}

            {preparando > 0 && (
              <span className="rounded-full bg-[#F1EEEA] px-2.5 py-1 text-[11px] font-medium text-[#6F695E]">
                {preparando} preparando
              </span>
            )}

            {listos > 0 && (
              <span className="rounded-full bg-[#E8F1EC] px-2.5 py-1 text-[11px] font-medium text-[#2E6B4F]">
                {listos} listo
                {listos !== 1
                  ? "s"
                  : ""}
              </span>
            )}
          </div>
        </div>

        {/* ITEMS */}
        <div className="px-5">
          {comanda.items.length ===
          0 ? (
            <div className="py-8 text-center text-sm text-[#8A8375]">
              Esta comanda no tiene
              productos.
            </div>
          ) : (
            comanda.items.map(
              renderItem,
            )
          )}
        </div>
      </article>
    );
  };

  // ============================================================
  // COLUMNA
  // ============================================================

  const renderColumna = (
    titulo: string,
    descripcion: string,
    lista: ComandaCocina[],
    icono: React.ReactNode,
  ) => {
    return (
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-[#F1EEEA] text-[#6F695E]">
              {icono}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#22201D]">
                {titulo}
              </h2>

              <p className="mt-0.5 text-xs text-[#8A8375]">
                {descripcion}
              </p>
            </div>
          </div>

          <span className="flex size-7 items-center justify-center rounded-full bg-[#22201D] text-xs font-semibold text-white">
            {lista.length}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {lista.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-[#D8D0C3] bg-[#FAF8F4] px-5 text-center">
              <Utensils
                size={25}
                className="text-[#B8B1A4]"
              />

              <p className="mt-3 text-sm font-medium text-[#22201D]">
                No hay comandas
              </p>

              <p className="mt-1 text-xs text-[#8A8375]">
                Esta sección está al
                día.
              </p>
            </div>
          ) : (
            lista.map(
              renderComanda,
            )
          )}
        </div>
      </section>
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1500px] p-6">
        <div className="flex items-center gap-2 text-sm text-[#8A8375]">
          <Loader2
            size={16}
            className="animate-spin"
          />

          Cargando cocina...
        </div>
      </main>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 p-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#22201D] text-white">
              <ChefHat size={20} />
            </div>

            <div>
              <h1 className=" text-2xl text-[#22201D]">
                Cocina
              </h1>

              <p className="mt-1 text-sm text-[#8A8375]">
                Gestiona las comandas y
                prepara los pedidos.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            void actualizar()
          }
          disabled={actualizando}
          className="flex items-center justify-center gap-2 rounded-md border border-[#E4DED3] bg-white px-4 py-2.5 text-sm font-medium text-[#22201D] transition hover:bg-[#F5F2ED] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              actualizando
                ? "animate-spin"
                : ""
            }
          />

          Actualizar
        </button>
      </header>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-start gap-3 border border-[#E7B8AD] bg-[#FFF5F2] px-4 py-3 text-sm text-[#A3402A]">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-medium">
              Ocurrió un error
            </p>

            <p className="mt-0.5">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setError(null)
            }
            className="text-xs underline"
          >
            cerrar
          </button>
        </div>
      )}

      {/* ======================================================
          RESUMEN
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[#E4DED3] bg-white px-4 py-3">
          <p className="text-xs text-[#8A8375]">
            Comandas abiertas
          </p>

          <p className="mt-1  text-2xl text-[#22201D]">
            {comandas.length}
          </p>
        </div>

        <div className="rounded-lg border border-[#E4DED3] bg-white px-4 py-3">
          <p className="text-xs text-[#8A8375]">
            Pendientes
          </p>

          <p className="mt-1  text-2xl text-[#A3402A]">
            {comandasPendientes.length}
          </p>
        </div>

        <div className="rounded-lg border border-[#E4DED3] bg-white px-4 py-3">
          <p className="text-xs text-[#8A8375]">
            Preparando
          </p>

          <p className="mt-1   text-2xl text-[#6F695E]">
            {comandasPreparando.length}
          </p>
        </div>

        <div className="rounded-lg border border-[#E4DED3] bg-white px-4 py-3">
          <p className="text-xs text-[#8A8375]">
            Listas
          </p>

          <p className="mt-1  text-2xl text-[#2E6B4F]">
            {comandasListas.length}
          </p>
        </div>
      </div>

      {/* ======================================================
          COCINA
      ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">
        {renderColumna(
          "Pendientes",
          "Nuevas comandas",
          comandasPendientes,
          <AlertCircle size={18} />,
        )}

        {renderColumna(
          "Preparando",
          "En elaboración",
          comandasPreparando,
          <ChefHat size={18} />,
        )}

        {renderColumna(
          "Listas",
          "Productos terminados",
          comandasListas,
          <Check size={18} />,
        )}
      </div>
    </main>
  );
}
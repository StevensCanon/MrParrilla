"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChefHat,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  Utensils,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

type Comanda = {
  id: string;
  canal: string;
  mesa_id: string | null;
  mesero_id: string | null;
  estado: string;
  abierta_en: string;
  archivada: boolean;
};

type ComandaItem = {
  id: string;
  comanda_id: string;
  plato_id: string;
  item_padre_id: string | null;
  opcion_id: string | null;
  menu_opcion_id: string | null;
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

type OpcionGrupo = {
  id: string;
  nombre: string;
};

type MenuOpcion = {
  id: string;
  menu_grupo_id: string;
  opcion_id: string;
};

type MenuGrupo = {
  id: string;
  grupo_id: string;
};

type GrupoOpcion = {
  id: string;
  nombre: string;
};

type OpcionCocina = {
  menu_opcion_id: string | null;
  opcion_id: string | null;
  grupo_id: string | null;
  grupo_nombre: string;
  nombre: string;
};

type ItemCocina = ComandaItem & {
  plato: Plato | null;
  opciones: OpcionCocina[];
};

type ComandaCocina = Comanda & {
  mesa: Mesa | null;
  items: ItemCocina[];
};

/*
 * ============================================================
 * UTILIDADES
 * ============================================================
 */

const formatearHora = (fecha: string) =>
  new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));

const tiempoTranscurrido = (fecha: string) => {
  const inicio = new Date(fecha).getTime();
  const minutos = Math.max(0, Math.floor((Date.now() - inicio) / 60000));

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

/*
 * ============================================================
 * PÁGINA
 * ============================================================
 */

export default function CocinaPage() {
  const router = useRouter();

  const [comandas, setComandas] = useState<ComandaCocina[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accionando, setAccionando] = useState<string | null>(null);

  /*
   * ============================================================
   * CARGAR COMANDAS
   * ============================================================
   */

  const cargarComandas = useCallback(
    async (mostrarLoading = false) => {
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
        setLoading(false);
        setActualizando(false);
        return;
      }

      try {
        /*
         * ========================================================
         * 1. COMANDAS ABIERTAS
         * ========================================================
         */

        const { data: comandasData, error: comandasError } = await supabase
          .from("comandas")
          .select(
            "id, canal, mesa_id, mesero_id, estado, abierta_en, archivada",
          )
          .eq("estado", "abierta")
          .eq("archivada", false)
          .order("abierta_en", {
            ascending: true,
          });

        if (comandasError) {
          throw new Error(comandasError.message);
        }

        const comandasBase = (comandasData as Comanda[]) ?? [];

        if (comandasBase.length === 0) {
          setComandas([]);
          return;
        }

        /*
         * ========================================================
         * 2. MESAS
         * ========================================================
         */

        const mesaIds = Array.from(
          new Set(
            comandasBase
              .map((comanda) => comanda.mesa_id)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        let mesasData: Mesa[] = [];

        if (mesaIds.length > 0) {
          const { data, error: mesasError } = await supabase
            .from("mesas")
            .select("id, nombre")
            .in("id", mesaIds);

          if (mesasError) {
            throw new Error(mesasError.message);
          }

          mesasData = (data as Mesa[]) ?? [];
        }

        /*
         * ========================================================
         * 3. ITEMS
         * ========================================================
         */

        const comandaIds = comandasBase.map((comanda) => comanda.id);

        const { data: itemsData, error: itemsError } = await supabase
          .from("comanda_items")
          .select(
            [
              "id",
              "comanda_id",
              "plato_id",
              "item_padre_id",
              "opcion_id",
              "menu_opcion_id",
              "cantidad",
              "observaciones",
              "precio_unitario",
              "estado",
            ].join(", "),
          )
          .in("comanda_id", comandaIds)
          .order("creado_en", {
            ascending: true,
          });

        if (itemsError) {
          throw new Error(itemsError.message);
        }

        const items = (itemsData as ComandaItem[]) ?? [];

        /*
         * ========================================================
         * 4. PADRES E HIJOS
         * ========================================================
         */

        const itemsPadre = items.filter((item) => item.item_padre_id === null);

        const itemsHijo = items.filter((item) => item.item_padre_id !== null);

        /*
         * ========================================================
         * 5. PLATOS
         * ========================================================
         */

        const platoIds = Array.from(
          new Set(items.map((item) => item.plato_id)),
        );

        let platosData: Plato[] = [];

        if (platoIds.length > 0) {
          const { data, error: platosError } = await supabase
            .from("platos")
            .select("id, nombre, categoria")
            .in("id", platoIds);

          if (platosError) {
            throw new Error(platosError.message);
          }

          platosData = (data as Plato[]) ?? [];
        }

        /*
         * ========================================================
         * 6. OPCIONES
         * ========================================================
         */

        const opcionIds = Array.from(
          new Set(
            itemsHijo
              .map((item) => item.opcion_id)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        const menuOpcionIds = Array.from(
          new Set(
            itemsHijo
              .map((item) => item.menu_opcion_id)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        let opcionesData: OpcionGrupo[] = [];
        let menuOpcionesData: MenuOpcion[] = [];
        let menuGruposData: MenuGrupo[] = [];
        let gruposData: GrupoOpcion[] = [];

        /*
         * OPCIONES
         */

        if (opcionIds.length > 0) {
          const { data, error: opcionesError } = await supabase
            .from("opciones_grupo")
            .select("id, nombre")
            .in("id", opcionIds);

          if (opcionesError) {
            throw new Error(opcionesError.message);
          }

          opcionesData = (data as OpcionGrupo[]) ?? [];
        }

        /*
         * MENU OPCIONES
         */

        if (menuOpcionIds.length > 0) {
          const { data, error: menuOpcionesError } = await supabase
            .from("menu_opciones")
            .select("id, menu_grupo_id, opcion_id")
            .in("id", menuOpcionIds);

          if (menuOpcionesError) {
            throw new Error(menuOpcionesError.message);
          }

          menuOpcionesData = (data as MenuOpcion[]) ?? [];
        }

        /*
         * MENU GRUPOS
         */

        const menuGrupoIds = Array.from(
          new Set(menuOpcionesData.map((item) => item.menu_grupo_id)),
        );

        if (menuGrupoIds.length > 0) {
          const { data, error: menuGruposError } = await supabase
            .from("menu_grupos")
            .select("id, grupo_id")
            .in("id", menuGrupoIds);

          if (menuGruposError) {
            throw new Error(menuGruposError.message);
          }

          menuGruposData = (data as MenuGrupo[]) ?? [];
        }

        /*
         * GRUPOS
         */

        const grupoIds = Array.from(
          new Set(menuGruposData.map((item) => item.grupo_id)),
        );

        if (grupoIds.length > 0) {
          const { data, error: gruposError } = await supabase
            .from("grupos_opcion")
            .select("id, nombre")
            .in("id", grupoIds);

          if (gruposError) {
            throw new Error(gruposError.message);
          }

          gruposData = (data as GrupoOpcion[]) ?? [];
        }

        /*
         * ========================================================
         * 7. MAPAS
         * ========================================================
         */

        const mesasMap = new Map(mesasData.map((mesa) => [mesa.id, mesa]));

        const platosMap = new Map(platosData.map((plato) => [plato.id, plato]));

        const opcionesMap = new Map(
          opcionesData.map((opcion) => [opcion.id, opcion]),
        );

        const menuOpcionesMap = new Map(
          menuOpcionesData.map((opcion) => [opcion.id, opcion]),
        );

        const menuGruposMap = new Map(
          menuGruposData.map((grupo) => [grupo.id, grupo]),
        );

        const gruposMap = new Map(gruposData.map((grupo) => [grupo.id, grupo]));

        /*
         * ========================================================
         * 8. CONSTRUIR OPCIONES
         * ========================================================
         */

        const construirOpciones = (itemPadreId: string): OpcionCocina[] => {
          return itemsHijo
            .filter((item) => item.item_padre_id === itemPadreId)
            .map((hijo) => {
              const opcion = hijo.opcion_id
                ? opcionesMap.get(hijo.opcion_id)
                : null;

              const menuOpcion = hijo.menu_opcion_id
                ? menuOpcionesMap.get(hijo.menu_opcion_id)
                : null;

              const menuGrupo = menuOpcion
                ? menuGruposMap.get(menuOpcion.menu_grupo_id)
                : null;

              const grupo = menuGrupo
                ? gruposMap.get(menuGrupo.grupo_id)
                : null;

              return {
                menu_opcion_id: hijo.menu_opcion_id,
                opcion_id: hijo.opcion_id,
                grupo_id: menuGrupo?.grupo_id ?? null,
                grupo_nombre: grupo?.nombre ?? "Opción",
                nombre: opcion?.nombre ?? "Opción seleccionada",
              };
            });
        };

        /*
         * ========================================================
         * 9. CONSTRUIR COMANDAS
         * ========================================================
         */

        const resultado: ComandaCocina[] = comandasBase.map((comanda) => {
          const itemsComanda = itemsPadre
            .filter((item) => item.comanda_id === comanda.id)
            .map((item) => ({
              ...item,
              plato: platosMap.get(item.plato_id) ?? null,
              opciones: construirOpciones(item.id),
            }));

          return {
            ...comanda,
            mesa: comanda.mesa_id
              ? (mesasMap.get(comanda.mesa_id) ?? null)
              : null,
            items: itemsComanda,
          };
        });

        setComandas(resultado);
      } catch (err) {
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
    [router],
  );

  /*
   * ============================================================
   * ACTUALIZACIÓN AUTOMÁTICA
   * ============================================================
   */

  useEffect(() => {
    void cargarComandas(true);

    const intervalo = window.setInterval(() => {
      void cargarComandas(false);
    }, 10000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [cargarComandas]);

  /*
   * ============================================================
   * ACTUALIZAR MANUALMENTE
   * ============================================================
   */

  const actualizar = async () => {
    if (actualizando) {
      return;
    }

    await cargarComandas(false);
  };

  /*
   * ============================================================
   * CAMBIAR ESTADO DEL ITEM
   * ============================================================
   */

  const cambiarEstadoItem = async (
    itemId: string,
    nuevoEstado: "preparando" | "listo",
  ) => {
    if (accionando) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setAccionando(itemId);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("comanda_items")
        .update({
          estado: nuevoEstado,
        })
        .eq("id", itemId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await cargarComandas(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el producto.",
      );
    } finally {
      setAccionando(null);
    }
  };

  /*
   * ============================================================
   * ARCHIVAR COMANDA
   * ============================================================
   */

  const archivarComanda = async (comandaId: string) => {
    if (accionando) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setAccionando(comandaId);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("comandas")
        .update({
          archivada: true,
        })
        .eq("id", comandaId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      await cargarComandas(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo archivar la comanda.",
      );
    } finally {
      setAccionando(null);
    }
  };

  /*
   * ============================================================
   * COLUMNAS
   * ============================================================
   */

  const comandasPendientes = comandas
    .filter((comanda) =>
      comanda.items.some((item) => item.estado === "pendiente"),
    )
    .sort(
      (a, b) =>
        new Date(a.abierta_en).getTime() - new Date(b.abierta_en).getTime(),
    );

  const comandasPreparando = comandas
    .filter((comanda) =>
      comanda.items.some((item) => item.estado === "preparando"),
    )
    .sort(
      (a, b) =>
        new Date(a.abierta_en).getTime() - new Date(b.abierta_en).getTime(),
    );

  const comandasListas = comandas
    .filter(
      (comanda) =>
        comanda.items.length > 0 &&
        comanda.items.every((item) => item.estado === "listo"),
    )
    .sort(
      (a, b) =>
        new Date(a.abierta_en).getTime() - new Date(b.abierta_en).getTime(),
    );

  /*
   * ============================================================
   * RENDER ITEM
   * ============================================================
   */

  const renderItem = (item: ItemCocina) => {
    const procesando = accionando === item.id;

    return (
      <div
        key={item.id}
        className="border-b border-[#E7E1D7] py-4 last:border-0"
      >
        <div className="flex items-start gap-3">
          {/* CANTIDAD */}

          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#22201D] text-sm font-bold text-white">
            {item.cantidad}
          </span>

          {/* INFORMACIÓN */}

          <div className="min-w-0 flex-1">
            <div className="flex flex-col">
              <span className="font-semibold text-[#22201D]">
                {item.plato?.nombre ?? "Producto"}
              </span>

              {item.plato?.categoria && (
                <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[#9A9183]">
                  {item.plato.categoria}
                </span>
              )}
            </div>

            {/* OPCIONES */}

            {item.opciones.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {item.opciones.map((opcion, index) => (
                  <div
                    key={
                      opcion.menu_opcion_id ??
                      opcion.opcion_id ??
                      `${item.id}-${index}`
                    }
                    className="flex items-start gap-1.5 text-xs"
                  >
                    <span className="font-semibold text-[#6F695E]">
                      {opcion.grupo_nombre}:
                    </span>

                    <span className="text-[#302D28]">{opcion.nombre}</span>
                  </div>
                ))}
              </div>
            )}

            {/* OBSERVACIÓN */}

            {item.observaciones && (
              <div className="mt-3 rounded-md border-l-2 border-[#C45A3D] bg-[#FFF7F4] px-3 py-2">
                <p className="text-xs font-medium text-[#A3402A]">
                  {item.observaciones}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ACCIÓN */}

        <div className="mt-3 pl-11">
          {item.estado === "pendiente" && (
            <button
              type="button"
              disabled={procesando}
              onClick={() => void cambiarEstadoItem(item.id, "preparando")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C85C3D] px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#AE4D32] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              Preparar
            </button>
          )}

          {item.estado === "preparando" && (
            <button
              type="button"
              disabled={procesando}
              onClick={() => void cambiarEstadoItem(item.id, "listo")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3D8060] px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#326A4F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Marcar listo
            </button>
          )}

          {item.estado === "listo" && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-[#EAF4EE] px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#2E6B4F]">
              <Check size={14} />
              Listo
            </div>
          )}
        </div>
      </div>
    );
  };

  /*
   * ============================================================
   * RENDER COMANDA
   * ============================================================
   */

  const renderComanda = (
    comanda: ComandaCocina,
    tipo: "pendiente" | "preparando" | "listo",
  ) => {
    const mesaNumero =
      comanda.mesa?.nombre?.replace(/^mesa\s*/i, "") ?? "Sin mesa";

    const pendientes = comanda.items.filter(
      (item) => item.estado === "pendiente",
    ).length;

    const preparando = comanda.items.filter(
      (item) => item.estado === "preparando",
    ).length;

    const listos = comanda.items.filter(
      (item) => item.estado === "listo",
    ).length;

    const todosListos =
      comanda.items.length > 0 &&
      comanda.items.every((item) => item.estado === "listo");

    const colorComanda =
      tipo === "pendiente"
        ? {
            borde: "border-[#E9C5B9]",
            fondo: "bg-[#FFFBF9]",
            cabecera: "bg-[#FFF3EF]",
            acento: "bg-[#C85C3D]",
          }
        : tipo === "preparando"
          ? {
              borde: "border-[#E5D3A7]",
              fondo: "bg-[#FFFDF8]",
              cabecera: "bg-[#FFF8E8]",
              acento: "bg-[#C18A2B]",
            }
          : {
              borde: "border-[#BED8C7]",
              fondo: "bg-[#FAFDFB]",
              cabecera: "bg-[#EFF8F2]",
              acento: "bg-[#3D8060]",
            };

    return (
      <article
        key={comanda.id}
        className={`overflow-hidden rounded-xl border ${colorComanda.borde} ${colorComanda.fondo} shadow-sm transition hover:shadow-md`}
      >
        {/* ====================================================
            CABECERA
        ==================================================== */}

        <div
          className={`border-b ${colorComanda.borde} ${colorComanda.cabecera} px-5 py-4`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A8375]">
                  Mesa
                </span>

                <span className="text-xl font-bold text-[#22201D]">
                  {mesaNumero}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8A8375]">
                <span className="flex items-center gap-1.5">
                  <Clock3 size={13} />

                  {formatearHora(comanda.abierta_en)}
                </span>

                <span>{tiempoTranscurrido(comanda.abierta_en)}</span>
              </div>
            </div>

            {/* ESTADO */}

            <div
              className={`flex size-9 items-center justify-center rounded-full ${colorComanda.acento} text-white`}
            >
              {tipo === "pendiente" && <AlertCircle size={17} />}

              {tipo === "preparando" && <ChefHat size={17} />}

              {tipo === "listo" && <Check size={18} />}
            </div>
          </div>

          {/* RESUMEN */}

          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-[#8A8375]">
              {comanda.items.length}{" "}
              {comanda.items.length === 1 ? "producto" : "productos"}
            </span>

            <div className="flex flex-wrap justify-end gap-1.5">
              {pendientes > 0 && (
                <span className="rounded-full bg-[#FCE7E1] px-2 py-1 text-[10px] font-semibold text-[#A3402A]">
                  {pendientes} pendiente
                  {pendientes !== 1 ? "s" : ""}
                </span>
              )}

              {preparando > 0 && (
                <span className="rounded-full bg-[#F7EBCB] px-2 py-1 text-[10px] font-semibold text-[#94691D]">
                  {preparando} preparando
                </span>
              )}

              {listos > 0 && (
                <span className="rounded-full bg-[#DDEFE3] px-2 py-1 text-[10px] font-semibold text-[#2E6B4F]">
                  {listos} listo
                  {listos !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================
            PRODUCTOS
        ==================================================== */}

        <div className="px-5">
          {comanda.items.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#8A8375]">
              Esta comanda no tiene productos.
            </div>
          ) : (
            comanda.items.map(renderItem)
          )}
        </div>

        {/* ====================================================
            ARCHIVAR
        ==================================================== */}

        {todosListos && (
          <div className="border-t border-[#BED8C7] bg-[#EFF8F2] px-5 py-4">
            <button
              type="button"
              disabled={accionando === comanda.id}
              onClick={() => void archivarComanda(comanda.id)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E6B4F] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#24583F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {accionando === comanda.id ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}

              {accionando === comanda.id ? "Archivando..." : "Archivar comanda"}
            </button>
          </div>
        )}
      </article>
    );
  };

  /*
   * ============================================================
   * RENDER COLUMNA
   * ============================================================
   */

  const renderColumna = (
    titulo: string,
    descripcion: string,
    lista: ComandaCocina[],
    tipo: "pendiente" | "preparando" | "listo",
    icono: ReactNode,
  ) => {
    const colores =
      tipo === "pendiente"
        ? {
            fondo: "bg-[#FFF8F5]",
            borde: "border-[#E9C5B9]",
            icono: "bg-[#FCE7E1] text-[#A3402A]",
            contador: "bg-[#C85C3D] text-white",
          }
        : tipo === "preparando"
          ? {
              fondo: "bg-[#FFFCF5]",
              borde: "border-[#E5D3A7]",
              icono: "bg-[#F7EBCB] text-[#94691D]",
              contador: "bg-[#C18A2B] text-white",
            }
          : {
              fondo: "bg-[#F8FCF9]",
              borde: "border-[#BED8C7]",
              icono: "bg-[#DDEFE3] text-[#2E6B4F]",
              contador: "bg-[#3D8060] text-white",
            };

    return (
      <section className="min-w-0">
        {/* ENCABEZADO DE COLUMNA */}

        <div
          className={`mb-4 rounded-xl border ${colores.borde} ${colores.fondo} p-4`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${colores.icono}`}
              >
                {icono}
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#22201D]">
                  {titulo}
                </h2>

                <p className="mt-0.5 text-xs text-[#8A8375]">{descripcion}</p>
              </div>
            </div>

            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${colores.contador} text-xs font-bold`}
            >
              {lista.length}
            </span>
          </div>
        </div>

        {/* COMANDAS */}

        <div className="flex flex-col gap-4">
          {lista.length === 0 ? (
            <div
              className={`flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed ${colores.borde} ${colores.fondo} px-5 text-center`}
            >
              <Utensils size={26} className="text-[#B8B1A4]" />

              <p className="mt-3 text-sm font-semibold text-[#22201D]">
                No hay comandas
              </p>

              <p className="mt-1 text-xs text-[#8A8375]">
                Esta sección está al día.
              </p>
            </div>
          ) : (
            lista.map((comanda) => renderComanda(comanda, tipo))
          )}
        </div>
      </section>
    );
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-[1500px] items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-[#8A8375]">
          <Loader2 size={18} className="animate-spin" />
          Cargando cocina...
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 p-4 md:p-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="flex flex-col gap-4 rounded-xl border border-[#E4DED3] bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#22201D] text-white">
            <ChefHat size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#22201D]">
              Cocina
            </h1>

            <p className="mt-0.5 text-sm text-[#8A8375]">
              {comandas.length}{" "}
              {comandas.length === 1 ? "comanda activa" : "comandas activas"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void actualizar()}
          disabled={actualizando}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#D8D0C3] bg-[#FAF8F4] px-4 py-2.5 text-sm font-semibold text-[#22201D] transition hover:bg-[#F1ECE4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={actualizando ? "animate-spin" : ""} />
          Actualizar
        </button>
      </header>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-[#E7B8AD] bg-[#FFF5F2] px-4 py-3 text-sm text-[#A3402A]">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">Ocurrió un error</p>

            <p className="mt-0.5">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-medium underline"
          >
            cerrar
          </button>
        </div>
      )}

      {/* ======================================================
          RESUMEN
      ====================================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E9C5B9] bg-[#FFF8F5] px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#8A8375]">Pendientes</p>

            <span className="flex size-7 items-center justify-center rounded-full bg-[#FCE7E1] text-[#A3402A]">
              <AlertCircle size={14} />
            </span>
          </div>

          <p className="mt-1 text-2xl font-bold text-[#A3402A]">
            {comandasPendientes.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#E5D3A7] bg-[#FFFCF5] px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#8A8375]">Preparando</p>

            <span className="flex size-7 items-center justify-center rounded-full bg-[#F7EBCB] text-[#94691D]">
              <ChefHat size={14} />
            </span>
          </div>

          <p className="mt-1 text-2xl font-bold text-[#94691D]">
            {comandasPreparando.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#BED8C7] bg-[#F8FCF9] px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#8A8375]">Listas</p>

            <span className="flex size-7 items-center justify-center rounded-full bg-[#DDEFE3] text-[#2E6B4F]">
              <Check size={14} />
            </span>
          </div>

          <p className="mt-1 text-2xl font-bold text-[#2E6B4F]">
            {comandasListas.length}
          </p>
        </div>
      </div>

      {/* ======================================================
          COLUMNAS
      ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">
        {renderColumna(
          "Pendientes",
          "Nuevas comandas",
          comandasPendientes,
          "pendiente",
          <AlertCircle size={19} />,
        )}

        {renderColumna(
          "Preparando",
          "En elaboración",
          comandasPreparando,
          "preparando",
          <ChefHat size={19} />,
        )}

        {renderColumna(
          "Listas",
          "Productos terminados",
          comandasListas,
          "listo",
          <Check size={19} />,
        )}
      </div>
    </main>
  );
}

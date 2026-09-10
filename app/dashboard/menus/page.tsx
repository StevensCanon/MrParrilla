'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Eye,
  Pencil,
  Trash2,
  X,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

import CrearMenuModal from '@/components/modal/CrearMenuModal';
import { supabase } from '@/lib/supabaseClient';

type MenuPlato = {
  id: string;
  plato_id: string;
  activo: boolean;
  platos: {
    id: string;
    nombre: string;
    categoria: string;
  } | null;
};

type Menu = {
  id: string;
  fecha: string;
  estado: string;
  creado_en: string;
  menu_platos: MenuPlato[];
};

type OpcionDetalle = {
  id: string;
  nombre: string;
  recargo: number;
  stock_porciones: number | null;
  activo: boolean;
  orden: number;
  porciones_preparadas: number;
  porciones_reservadas: number;
  porciones_consumidas: number;
  agotado: boolean;
};

type GrupoDetalle = {
  id: string;
  nombre: string;
  obligatorio: boolean;
  orden: number;
  opciones: OpcionDetalle[];
};

type MenuPlatoDetalle = {
  id: string;
  plato_id: string;
  activo: boolean;
  plato: {
    id: string;
    nombre: string;
    categoria: string;
  } | null;
  grupos: GrupoDetalle[];
};

type MenuDetalle = {
  id: string;
  fecha: string;
  estado: string;
  creado_en: string;
  platos: MenuPlatoDetalle[];
};

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatearFechaCorta(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatearRecargo(recargo: number) {
  const valor = Number(recargo) || 0;

  if (valor <= 0) {
    return null;
  }

  return `+$${valor.toLocaleString('es-CO')}`;
}

/**
 * Obtiene la fecha actual usando la zona horaria de Colombia.
 *
 * Esto evita problemas cuando el navegador está cerca de medianoche
 * y UTC devuelve una fecha diferente a la fecha local de Colombia.
 */
function obtenerFechaColombia(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes.map((parte) => [parte.type, parte.value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * MODAL CREAR / EDITAR
   * ---------------------------------------------------------
   */

  const [modalAbierto, setModalAbierto] = useState(false);
  const [menuIdEditar, setMenuIdEditar] = useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * FILTROS
   * ---------------------------------------------------------
   */

  const [fechaExacta, setFechaExacta] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  /*
   * ---------------------------------------------------------
   * MODAL VER MENÚ
   * ---------------------------------------------------------
   */

  const [menuDetalle, setMenuDetalle] = useState<MenuDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [modalVerAbierto, setModalVerAbierto] = useState(false);

  /*
   * ---------------------------------------------------------
   * ELIMINACIÓN
   * ---------------------------------------------------------
   */

  const [eliminandoMenuId, setEliminandoMenuId] = useState<string | null>(
    null
  );

  /*
   * ---------------------------------------------------------
   * CARGAR MENÚS
   * ---------------------------------------------------------
   */

  const cargarMenus = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('menus')
        .select(`
          id,
          fecha,
          estado,
          creado_en,
          menu_platos (
            id,
            plato_id,
            activo,
            platos (
              id,
              nombre,
              categoria
            )
          )
        `)
        .order('fecha', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setMenus((data as Menu[]) ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar los menús.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarMenus();
  }, [cargarMenus]);

  /*
   * ---------------------------------------------------------
   * FILTRAR MENÚS
   * ---------------------------------------------------------
   */

  const menusFiltrados = useMemo(() => {
    return menus.filter((menu) => {
      if (fechaExacta && menu.fecha !== fechaExacta) {
        return false;
      }

      if (fechaDesde && menu.fecha < fechaDesde) {
        return false;
      }

      if (fechaHasta && menu.fecha > fechaHasta) {
        return false;
      }

      return true;
    });
  }, [menus, fechaExacta, fechaDesde, fechaHasta]);

  const hayFiltros =
    fechaExacta !== '' || fechaDesde !== '' || fechaHasta !== '';

  /*
   * ---------------------------------------------------------
   * LIMPIAR FILTROS
   * ---------------------------------------------------------
   */

  const limpiarFiltros = () => {
    setFechaExacta('');
    setFechaDesde('');
    setFechaHasta('');
  };

  /*
   * ---------------------------------------------------------
   * ABRIR CREAR
   * ---------------------------------------------------------
   */

  const abrirCrearMenu = () => {
    setMenuIdEditar(null);
    setModalAbierto(true);
  };

  /*
   * ---------------------------------------------------------
   * ABRIR EDITAR
   * ---------------------------------------------------------
   */

  const abrirEditarMenu = (menu: Menu) => {
    setError(null);
    setMenuIdEditar(menu.id);
    setModalAbierto(true);
  };

  /*
   * ---------------------------------------------------------
   * VER MENÚ
   * ---------------------------------------------------------
   */

  const verMenu = async (menu: Menu) => {
    try {
      setError(null);
      setCargandoDetalle(true);
      setModalVerAbierto(true);
      setMenuDetalle(null);

      const { data: menuPlatosData, error: menuPlatosError } =
        await supabase
          .from('menu_platos')
          .select(`
            id,
            plato_id,
            activo,
            platos (
              id,
              nombre,
              categoria
            )
          `)
          .eq('menu_id', menu.id)
          .order('id', { ascending: true });

      if (menuPlatosError) {
        throw menuPlatosError;
      }

      const menuPlatos = (menuPlatosData ?? []) as MenuPlato[];

      const platosDetalle: MenuPlatoDetalle[] = await Promise.all(
        menuPlatos
          .filter((menuPlato) => menuPlato.activo)
          .map(async (menuPlato) => {
            const { data: gruposData, error: gruposError } = await supabase
              .from('menu_grupos')
              .select(`
                id,
                menu_plato_id,
                grupo_id,
                activo,
                orden,
                grupos_opcion (
                  id,
                  nombre,
                  obligatorio,
                  orden
                )
              `)
              .eq('menu_plato_id', menuPlato.id)
              .eq('activo', true)
              .order('orden', { ascending: true });

            if (gruposError) {
              throw gruposError;
            }

            const gruposDetalle: GrupoDetalle[] = await Promise.all(
              (gruposData ?? []).map(async (menuGrupo) => {
                const grupoOriginal = Array.isArray(menuGrupo.grupos_opcion)
                  ? menuGrupo.grupos_opcion[0]
                  : menuGrupo.grupos_opcion;

                const { data: opcionesData, error: opcionesError } =
                  await supabase
                    .from('menu_opciones')
                    .select(`
                      id,
                      menu_grupo_id,
                      opcion_id,
                      activo,
                      orden,
                      porciones_preparadas,
                      porciones_reservadas,
                      porciones_consumidas,
                      agotado,
                      opciones_grupo (
                        id,
                        nombre,
                        recargo,
                        stock_porciones
                      )
                    `)
                    .eq('menu_grupo_id', menuGrupo.id)
                    .eq('activo', true)
                    .order('orden', { ascending: true });

                if (opcionesError) {
                  throw opcionesError;
                }

                const opciones: OpcionDetalle[] = (opcionesData ?? []).map(
                  (menuOpcion) => {
                    const opcionOriginal = Array.isArray(
                      menuOpcion.opciones_grupo
                    )
                      ? menuOpcion.opciones_grupo[0]
                      : menuOpcion.opciones_grupo;

                    return {
                      id: menuOpcion.id,
                      nombre:
                        opcionOriginal?.nombre ?? 'Opción eliminada',
                      recargo: Number(opcionOriginal?.recargo ?? 0),
                      stock_porciones:
                        opcionOriginal?.stock_porciones !== null &&
                        opcionOriginal?.stock_porciones !== undefined
                          ? Number(opcionOriginal.stock_porciones)
                          : null,
                      activo: menuOpcion.activo,
                      orden: menuOpcion.orden,
                      porciones_preparadas:
                        menuOpcion.porciones_preparadas ?? 0,
                      porciones_reservadas:
                        menuOpcion.porciones_reservadas ?? 0,
                      porciones_consumidas:
                        menuOpcion.porciones_consumidas ?? 0,
                      agotado: menuOpcion.agotado ?? false,
                    };
                  }
                );

                return {
                  id: menuGrupo.id,
                  nombre: grupoOriginal?.nombre ?? 'Grupo eliminado',
                  obligatorio: grupoOriginal?.obligatorio ?? false,
                  orden: grupoOriginal?.orden ?? menuGrupo.orden ?? 0,
                  opciones,
                };
              })
            );

            return {
              id: menuPlato.id,
              plato_id: menuPlato.plato_id,
              activo: menuPlato.activo,
              plato: menuPlato.platos,
              grupos: gruposDetalle,
            };
          })
      );

      setMenuDetalle({
        id: menu.id,
        fecha: menu.fecha,
        estado: menu.estado,
        creado_en: menu.creado_en,
        platos: platosDetalle,
      });
    } catch (err) {
      setModalVerAbierto(false);

      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar la configuración del menú.'
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * ELIMINAR MENÚ
   * ---------------------------------------------------------
   *
   * Se mantiene la eliminación física solamente cuando ninguna
   * menu_opcion está referenciada por reservas o pedidos.
   */

  const eliminarMenu = async (menu: Menu) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el menú del ${formatearFechaCorta(
        menu.fecha
      )}?\n\nEsta acción eliminará la configuración del menú, pero no eliminará los platos ni las opciones originales.`
    );

    if (!confirmar) {
      return;
    }

    try {
      setError(null);
      setEliminandoMenuId(menu.id);

      const { data: menuPlatosData, error: menuPlatosError } =
        await supabase
          .from('menu_platos')
          .select('id')
          .eq('menu_id', menu.id);

      if (menuPlatosError) {
        throw menuPlatosError;
      }

      const menuPlatoIds = (menuPlatosData ?? []).map(
        (item) => item.id
      );

      if (menuPlatoIds.length === 0) {
        const { error: deleteMenuError } = await supabase
          .from('menus')
          .delete()
          .eq('id', menu.id);

        if (deleteMenuError) {
          throw deleteMenuError;
        }

        setMenus((actuales) =>
          actuales.filter((actual) => actual.id !== menu.id)
        );

        return;
      }

      const { data: menuGruposData, error: menuGruposError } =
        await supabase
          .from('menu_grupos')
          .select('id')
          .in('menu_plato_id', menuPlatoIds);

      if (menuGruposError) {
        throw menuGruposError;
      }

      const menuGrupoIds = (menuGruposData ?? []).map(
        (item) => item.id
      );

      let menuOpcionIds: string[] = [];

      if (menuGrupoIds.length > 0) {
        const { data: menuOpcionesData, error: menuOpcionesError } =
          await supabase
            .from('menu_opciones')
            .select('id')
            .in('menu_grupo_id', menuGrupoIds);

        if (menuOpcionesError) {
          throw menuOpcionesError;
        }

        menuOpcionIds = (menuOpcionesData ?? []).map(
          (item) => item.id
        );
      }

      if (menuOpcionIds.length > 0) {
        const { data: reservasData, error: reservasError } =
          await supabase
            .from('reservas_menu_opciones')
            .select('id, menu_opcion_id')
            .in('menu_opcion_id', menuOpcionIds)
            .limit(1);

        if (reservasError) {
          throw reservasError;
        }

        if ((reservasData ?? []).length > 0) {
          setError(
            'No se puede eliminar este menú porque una o más opciones ya tienen reservas asociadas a pedidos.'
          );
          return;
        }

        const { data: comandaItemsData, error: comandaItemsError } =
          await supabase
            .from('comanda_items')
            .select('id, menu_opcion_id')
            .in('menu_opcion_id', menuOpcionIds)
            .limit(1);

        if (comandaItemsError) {
          throw comandaItemsError;
        }

        if ((comandaItemsData ?? []).length > 0) {
          setError(
            'No se puede eliminar este menú porque una o más opciones ya están asociadas a pedidos.'
          );
          return;
        }
      }

      if (menuOpcionIds.length > 0) {
        const { error: deleteOpcionesError } = await supabase
          .from('menu_opciones')
          .delete()
          .in('id', menuOpcionIds);

        if (deleteOpcionesError) {
          throw deleteOpcionesError;
        }
      }

      if (menuGrupoIds.length > 0) {
        const { error: deleteGruposError } = await supabase
          .from('menu_grupos')
          .delete()
          .in('id', menuGrupoIds);

        if (deleteGruposError) {
          throw deleteGruposError;
        }
      }

      const { error: deletePlatosError } = await supabase
        .from('menu_platos')
        .delete()
        .in('id', menuPlatoIds);

      if (deletePlatosError) {
        throw deletePlatosError;
      }

      const { error: deleteMenuError } = await supabase
        .from('menus')
        .delete()
        .eq('id', menu.id);

      if (deleteMenuError) {
        throw deleteMenuError;
      }

      setMenus((actuales) =>
        actuales.filter((actual) => actual.id !== menu.id)
      );

      if (menuDetalle?.id === menu.id) {
        setModalVerAbierto(false);
        setMenuDetalle(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible eliminar el menú.'
      );
    } finally {
      setEliminandoMenuId(null);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Menús
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Administra los menús disponibles y consulta su configuración.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirCrearMenu}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-zinc-900
              px-4
              py-2.5
              text-sm
              font-medium
              text-white
              shadow-sm
              transition
              hover:bg-zinc-800
            "
          >
            <span className="text-base leading-none">+</span>
            Crear menú del día
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-sm text-red-500">⚠</span>

            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-xs text-red-400 hover:text-red-600"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* FILTROS */}
        <section className="mb-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-zinc-500" />

              <h2 className="text-sm font-semibold text-zinc-900">
                Filtrar menús
              </h2>
            </div>

            <p className="text-xs text-zinc-500">
              Busca un día específico o un rango de fechas.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {/* FECHA EXACTA */}
            <div>
              <label
                htmlFor="fecha-exacta"
                className="mb-1.5 block text-xs font-medium text-zinc-600"
              >
                Fecha exacta
              </label>

              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="fecha-exacta"
                  type="date"
                  value={fechaExacta}
                  onChange={(e) => {
                    setFechaExacta(e.target.value);

                    if (e.target.value) {
                      setFechaDesde('');
                      setFechaHasta('');
                    }
                  }}
                  className="
                    h-10
                    w-full
                    rounded-xl
                    border
                    border-zinc-200
                    bg-white
                    pl-9
                    pr-3
                    text-sm
                    text-zinc-800
                    outline-none
                    transition
                    focus:border-zinc-400
                    focus:ring-2
                    focus:ring-zinc-100
                  "
                />
              </div>
            </div>

            {/* DESDE */}
            <div>
              <label
                htmlFor="fecha-desde"
                className="mb-1.5 block text-xs font-medium text-zinc-600"
              >
                Desde
              </label>

              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="fecha-desde"
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => {
                    setFechaDesde(e.target.value);

                    if (e.target.value) {
                      setFechaExacta('');
                    }
                  }}
                  className="
                    h-10
                    w-full
                    rounded-xl
                    border
                    border-zinc-200
                    bg-white
                    pl-9
                    pr-3
                    text-sm
                    text-zinc-800
                    outline-none
                    transition
                    focus:border-zinc-400
                    focus:ring-2
                    focus:ring-zinc-100
                  "
                />
              </div>
            </div>

            {/* HASTA */}
            <div>
              <label
                htmlFor="fecha-hasta"
                className="mb-1.5 block text-xs font-medium text-zinc-600"
              >
                Hasta
              </label>

              <div className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  id="fecha-hasta"
                  type="date"
                  min={fechaDesde || undefined}
                  value={fechaHasta}
                  onChange={(e) => {
                    setFechaHasta(e.target.value);

                    if (e.target.value) {
                      setFechaExacta('');
                    }
                  }}
                  className="
                    h-10
                    w-full
                    rounded-xl
                    border
                    border-zinc-200
                    bg-white
                    pl-9
                    pr-3
                    text-sm
                    text-zinc-800
                    outline-none
                    transition
                    focus:border-zinc-400
                    focus:ring-2
                    focus:ring-zinc-100
                  "
                />
              </div>
            </div>
          </div>

          {hayFiltros && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
              <p className="text-xs text-zinc-500">
                {menusFiltrados.length}{' '}
                {menusFiltrados.length === 1
                  ? 'menú encontrado'
                  : 'menús encontrados'}
              </p>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-lg
                  px-2.5
                  py-1.5
                  text-xs
                  font-medium
                  text-zinc-500
                  transition
                  hover:bg-zinc-100
                  hover:text-zinc-900
                "
              >
                <X size={14} />
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

        {/* CONTENEDOR */}
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  Menús creados
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Consulta y modifica los menús configurados anteriormente.
                </p>
              </div>

              {!cargando && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {menusFiltrados.length}{' '}
                  {menusFiltrados.length === 1 ? 'menú' : 'menús'}
                </span>
              )}
            </div>
          </div>

          {/* LOADING */}
          {cargando ? (
            <div className="divide-y divide-zinc-100">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse px-5 py-5 sm:px-6"
                >
                  <div className="h-4 w-40 rounded bg-zinc-200" />
                  <div className="mt-3 h-3 w-64 rounded bg-zinc-100" />
                </div>
              ))}
            </div>
          ) : menusFiltrados.length === 0 ? (
            <div className="flex min-h-[350px] items-center justify-center px-6">
              <div className="max-w-sm text-center">
                <div
                  className="
                    mx-auto
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-zinc-100
                    text-xl
                  "
                >
                  🍽️
                </div>

                <h3 className="text-sm font-semibold text-zinc-800">
                  {hayFiltros
                    ? 'No hay menús con esos filtros'
                    : 'No hay menús creados'}
                </h3>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {hayFiltros
                    ? 'Prueba con otra fecha o limpia los filtros para ver todos los menús.'
                    : 'Crea el menú del día para comenzar a configurar los platos disponibles.'}
                </p>

                {hayFiltros ? (
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="
                      mt-5
                      rounded-lg
                      border
                      border-zinc-200
                      px-4
                      py-2.5
                      text-sm
                      font-medium
                      text-zinc-700
                      transition
                      hover:bg-zinc-100
                    "
                  >
                    Limpiar filtros
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={abrirCrearMenu}
                    className="
                      mt-5
                      rounded-lg
                      bg-zinc-900
                      px-4
                      py-2.5
                      text-sm
                      font-medium
                      text-white
                      transition
                      hover:bg-zinc-800
                    "
                  >
                    Crear menú del día
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {menusFiltrados.map((menu) => {
                const eliminando = eliminandoMenuId === menu.id;

                /*
                 * Solo el menú cuya fecha coincide con la fecha actual
                 * de Colombia puede ser editado.
                 */
                const esMenuDeHoy =
                  menu.fecha === obtenerFechaColombia();

                return (
                  <div
                    key={menu.id}
                    className="px-5 py-5 transition hover:bg-zinc-50/50 sm:px-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* INFO */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-sm font-semibold capitalize text-zinc-900">
                            {formatearFecha(menu.fecha)}
                          </h3>

                          <span
                            className={`
                              rounded-full
                              px-2
                              py-1
                              text-[10px]
                              font-semibold
                              uppercase
                              tracking-wide
                              ${
                                menu.estado === 'activo'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-zinc-100 text-zinc-500'
                              }
                            `}
                          >
                            {menu.estado}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {menu.menu_platos.filter(
                            (item) => item.activo
                          ).length === 0 ? (
                            <span className="text-xs text-zinc-400">
                              Sin platos configurados
                            </span>
                          ) : (
                            menu.menu_platos
                              .filter((item) => item.activo)
                              .map((menuPlato) => (
                                <span
                                  key={menuPlato.id}
                                  className="
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    rounded-lg
                                    border
                                    border-zinc-200
                                    bg-white
                                    px-2.5
                                    py-1.5
                                    text-xs
                                    font-medium
                                    text-zinc-700
                                  "
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />

                                  {menuPlato.platos?.nombre ??
                                    'Plato eliminado'}
                                </span>
                              ))
                          )}
                        </div>
                      </div>

                      {/* ACCIONES */}
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void verMenu(menu)}
                          disabled={eliminando}
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-lg
                            border
                            border-zinc-200
                            px-3
                            py-2
                            text-xs
                            font-medium
                            text-zinc-600
                            transition
                            hover:bg-zinc-100
                            hover:text-zinc-900
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          <Eye size={14} />
                          Ver
                        </button>

                        {esMenuDeHoy && (
                          <button
                            type="button"
                            onClick={() => abrirEditarMenu(menu)}
                            disabled={eliminando}
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-lg
                              border
                              border-zinc-200
                              px-3
                              py-2
                              text-xs
                              font-medium
                              text-zinc-600
                              transition
                              hover:bg-zinc-100
                              hover:text-zinc-900
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => void eliminarMenu(menu)}
                          disabled={eliminando}
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-lg
                            px-3
                            py-2
                            text-xs
                            font-medium
                            text-red-500
                            transition
                            hover:bg-red-50
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          <Trash2 size={14} />

                          {eliminando ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          MODAL VER MENÚ
          ===================================================== */}

      <Dialog
        open={modalVerAbierto}
        onOpenChange={(abierto) => {
          if (!cargandoDetalle) {
            setModalVerAbierto(abierto);

            if (!abierto) {
              setMenuDetalle(null);
            }
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden rounded-2xl bg-white p-0 sm:max-w-2xl">
          {/* HEADER */}
          <div className="border-b border-zinc-200 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {menuDetalle
                    ? `Menú del ${formatearFechaCorta(menuDetalle.fecha)}`
                    : 'Configuración del menú'}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Consulta los platos y opciones configuradas para este día.
                </p>
              </div>

              {menuDetalle && (
                <span
                  className={`
                    shrink-0
                    rounded-full
                    mx-4
                    px-2
                    py-1
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wide
                    ${
                      menuDetalle.estado === 'activo'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-zinc-100 text-zinc-500'
                    }
                  `}
                >
                  {menuDetalle.estado}
                </span>
              )}
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
            {cargandoDetalle ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-xl border border-zinc-200 p-4"
                  >
                    <div className="h-4 w-40 rounded bg-zinc-200" />

                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-full rounded bg-zinc-100" />
                      <div className="h-3 w-3/4 rounded bg-zinc-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : menuDetalle ? (
              <div className="space-y-4">
                {menuDetalle.platos.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
                    <p className="text-sm font-medium text-zinc-700">
                      Este menú no tiene platos configurados.
                    </p>
                  </div>
                ) : (
                  menuDetalle.platos.map((menuPlato) => (
                    <div
                      key={menuPlato.id}
                      className="overflow-hidden rounded-xl border shadow-zinc-400 shadow-xs"
                    >
                      {/* PLATO */}
                      <div className="border-b border-zinc-200 bg-yellow-100 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-black">
                              {menuPlato.plato?.nombre ??
                                'Plato eliminado'}
                            </h3>

                            {menuPlato.plato?.categoria && (
                              <p className="mt-0.5 text-xs capitalize text-zinc-700">
                                {menuPlato.plato.categoria}
                              </p>
                            )}
                          </div>

                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                            {menuPlato.grupos.length}{' '}
                            {menuPlato.grupos.length === 1
                              ? 'grupo'
                              : 'grupos'}
                          </span>
                        </div>
                      </div>

                      {/* GRUPOS */}
                      <div className="divide-y divide-zinc-100">
                        {menuPlato.grupos.length === 0 ? (
                          <div className="px-4 py-4">
                            <p className="text-xs text-zinc-400">
                              Este plato no tiene grupos de opciones.
                            </p>
                          </div>
                        ) : (
                          menuPlato.grupos.map((grupo) => (
                            <div
                              key={grupo.id}
                              className="px-4 py-4"
                            >
                              <div className="mb-3 flex items-center gap-2">
                                <h4 className="text-xs font-semibold text-zinc-800">
                                  {grupo.nombre}
                                </h4>

                                {grupo.obligatorio && (
                                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                                    Obligatorio
                                  </span>
                                )}
                              </div>

                              {grupo.opciones.length === 0 ? (
                                <p className="text-xs text-zinc-400">
                                  Sin opciones configuradas.
                                </p>
                              ) : (
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {grupo.opciones.map((opcion) => {
                                    const recargo = formatearRecargo(
                                      opcion.recargo
                                    );

                                    return (
                                      <div
                                        key={opcion.id}
                                        className="
                                          flex
                                          items-center
                                          justify-between
                                          gap-3
                                          rounded-lg
                                          border
                                          border-zinc-100
                                          bg-zinc-50
                                          px-3
                                          py-2.5
                                        "
                                      >
                                        <span className="min-w-0 truncate text-xs font-medium text-zinc-700">
                                          {opcion.nombre}
                                        </span>

                                        {recargo && (
                                          <span className="shrink-0 text-[11px] font-medium text-zinc-500">
                                            {recargo}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {/* FOOTER */}
          <div className="border-t border-zinc-200 px-6 py-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModalVerAbierto(false)}
                disabled={cargandoDetalle}
                className="
                  rounded-lg
                  border
                  border-zinc-200
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-zinc-700
                  transition
                  hover:bg-zinc-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cerrar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          MODAL CREAR / EDITAR
          ===================================================== */}

      <CrearMenuModal
        open={modalAbierto}
        menuId={menuIdEditar}
        onClose={() => {
          setModalAbierto(false);
          setMenuIdEditar(null);
        }}
        onCreated={async () => {
          await cargarMenus();
        }}
      />
    </main>
  );
}
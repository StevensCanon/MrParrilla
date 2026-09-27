import { useCallback, useMemo, useState } from 'react';

import type {
  Menu,
  MenuDetalle,
} from '../types/types';

import {
  cargarMenuDetalle,
  cargarMenus,
  eliminarMenu as eliminarMenuApi,
} from '../libs/libs';

export function useMenus() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [menuIdEditar, setMenuIdEditar] = useState<string | null>(null);

  const [fechaExacta, setFechaExacta] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [menuDetalle, setMenuDetalle] =
    useState<MenuDetalle | null>(null);

  const [cargandoDetalle, setCargandoDetalle] =
    useState(false);

  const [modalVerAbierto, setModalVerAbierto] =
    useState(false);

  const [eliminandoMenuId, setEliminandoMenuId] =
    useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const datos = await cargarMenus();

      setMenus(datos);
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

  const menusFiltrados = useMemo(() => {
    return menus.filter((menu) => {
      if (
        fechaExacta &&
        menu.fecha !== fechaExacta
      ) {
        return false;
      }

      if (
        fechaDesde &&
        menu.fecha < fechaDesde
      ) {
        return false;
      }

      if (
        fechaHasta &&
        menu.fecha > fechaHasta
      ) {
        return false;
      }

      return true;
    });
  }, [
    menus,
    fechaExacta,
    fechaDesde,
    fechaHasta,
  ]);

  const hayFiltros =
    fechaExacta !== '' ||
    fechaDesde !== '' ||
    fechaHasta !== '';

  const limpiarFiltros = useCallback(() => {
    setFechaExacta('');
    setFechaDesde('');
    setFechaHasta('');
  }, []);

  const abrirCrearMenu = useCallback(() => {
    setMenuIdEditar(null);
    setModalAbierto(true);
  }, []);

  const abrirEditarMenu = useCallback((menu: Menu) => {
    setError(null);
    setMenuIdEditar(menu.id);
    setModalAbierto(true);
  }, []);

  const cerrarModalCrear = useCallback(() => {
    setModalAbierto(false);
    setMenuIdEditar(null);
  }, []);

  const verMenu = useCallback(async (menu: Menu) => {
    try {
      setError(null);
      setCargandoDetalle(true);
      setModalVerAbierto(true);
      setMenuDetalle(null);

      const detalle = await cargarMenuDetalle(menu);

      setMenuDetalle(detalle);
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
  }, []);

  const cerrarModalDetalle = useCallback(() => {
    if (cargandoDetalle) {
      return;
    }

    setModalVerAbierto(false);
    setMenuDetalle(null);
  }, [cargandoDetalle]);

  const eliminar = useCallback(
    async (menu: Menu) => {
      try {
        setError(null);
        setEliminandoMenuId(menu.id);

        await eliminarMenuApi(menu.id);

        setMenus((actuales) =>
          actuales.filter(
            (actual) => actual.id !== menu.id
          )
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
    },
    [menuDetalle]
  );

  return {
    menus,
    menusFiltrados,
    cargando,
    error,
    setError,

    modalAbierto,
    menuIdEditar,
    abrirCrearMenu,
    abrirEditarMenu,
    cerrarModalCrear,

    fechaExacta,
    fechaDesde,
    fechaHasta,
    setFechaExacta,
    setFechaDesde,
    setFechaHasta,
    hayFiltros,
    limpiarFiltros,

    menuDetalle,
    cargandoDetalle,
    modalVerAbierto,
    verMenu,
    cerrarModalDetalle,

    eliminandoMenuId,
    eliminar,

    cargar,
  };
}
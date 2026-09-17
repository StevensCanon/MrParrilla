'use client';

import { useEffect } from 'react';

import CrearMenuModal from '@/components/modal/CrearMenuModal';

import MenusHeader from './components/MenusHeader';
import MenusFiltros from './components/MenusFiltros';
import MenusLista from './components/MenusLista';
import MenuDetalleModal from './components/MenusDetalleModal';

import { useMenus } from './hooks/useMenu';

import { formatearFechaCorta } from './utils/utils';

export default function MenusPage() {
  const {
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
  } = useMenus();

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const confirmarEliminacion = async (
    menu: Parameters<typeof eliminar>[0]
  ) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el menú del ${formatearFechaCorta(
        menu.fecha
      )}?\n\nEsta acción eliminará la configuración del menú, pero no eliminará los platos ni las opciones originales.`
    );

    if (!confirmar) {
      return;
    }

    await eliminar(menu);
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <MenusHeader onCrear={abrirCrearMenu} />

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-sm text-red-500">
              ⚠
            </span>

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

        <MenusFiltros
          fechaExacta={fechaExacta}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          cantidadResultados={menusFiltrados.length}
          hayFiltros={hayFiltros}
          onFechaExactaChange={setFechaExacta}
          onFechaDesdeChange={setFechaDesde}
          onFechaHastaChange={setFechaHasta}
          onLimpiar={limpiarFiltros}
        />

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
                  {menusFiltrados.length === 1
                    ? 'menú'
                    : 'menús'}
                </span>
              )}
            </div>
          </div>

          <MenusLista
            menus={menusFiltrados}
            cargando={cargando}
            hayFiltros={hayFiltros}
            eliminandoMenuId={eliminandoMenuId}
            onCrear={abrirCrearMenu}
            onLimpiar={limpiarFiltros}
            onVer={(menu) => {
              void verMenu(menu);
            }}
            onEditar={abrirEditarMenu}
            onEliminar={(menu) => {
              void confirmarEliminacion(menu);
            }}
          />
        </section>
      </div>

      <MenuDetalleModal
        open={modalVerAbierto}
        detalle={menuDetalle}
        cargando={cargandoDetalle}
        onOpenChange={(abierto) => {
          if (abierto) {
            return;
          }

          cerrarModalDetalle();
        }}
      />

      <CrearMenuModal
        open={modalAbierto}
        menuId={menuIdEditar}
        onClose={cerrarModalCrear}
        onCreated={async () => {
          await cargar();
        }}
      />
    </main>
  );
}
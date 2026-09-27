"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import InventarioHeader from "./components/InventarioHeader";
import InventarioFiltros from "./components/InventarioFiltros";
import InventarioTabla from "./components/InventarioTabla";
import InventarioMobile from "./components/InventarioMobile";
import InventarioPaginacion from "./components/InventarioPaginacion";
import ProductoDialog from "./components/ProductDialog";
import InventarioLoading from "./components/InventarioLoading";
import InventarioEmpty from "./components/InventarioEmpty";

import {
  PRODUCTOS_POR_PAGINA,
} from "./constants/constants";

import { useInventario } from "./hooks/useInventario";

import type {
  Producto,
} from "./types/types";

export default function InventarioPage() {
  const {
    productos,
    cargando,
    guardando,
    error,
    setError,

    modalAbierto,
    formulario,
    productoEditando,

    cargarProductos,
    abrirCrear,
    abrirEditar,
    cerrarModal,
    cambiarCampo,
    guardarProducto,
    eliminarProducto,
  } = useInventario();

  const [busqueda, setBusqueda] =
    useState("");

  const [categoriaFiltro, setCategoriaFiltro] =
    useState("todas");

  const [pagina, setPagina] =
    useState(1);

  useEffect(() => {
    void cargarProductos();
  }, [cargarProductos]);

  const productosFiltrados = useMemo(() => {
    const texto =
      busqueda.trim().toLowerCase();

    return productos.filter(
      (producto) => {
        const coincideBusqueda =
          !texto ||
          producto.nombre
            .toLowerCase()
            .includes(texto) ||
          producto.categoria
            ?.toLowerCase()
            .includes(texto);

        const coincideCategoria =
          categoriaFiltro === "todas" ||
          producto.categoria ===
            categoriaFiltro;

        return (
          coincideBusqueda &&
          coincideCategoria
        );
      },
    );
  }, [
    productos,
    busqueda,
    categoriaFiltro,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      productosFiltrados.length /
        PRODUCTOS_POR_PAGINA,
    ),
  );

  const paginaActual = Math.min(
    pagina,
    totalPaginas,
  );

  const productosPagina =
    productosFiltrados.slice(
      (paginaActual - 1) *
        PRODUCTOS_POR_PAGINA,
      paginaActual *
        PRODUCTOS_POR_PAGINA,
    );

  const cambiarBusqueda = (
    valor: string,
  ) => {
    setBusqueda(valor);
    setPagina(1);
  };

  const cambiarCategoria = (
    valor: string,
  ) => {
    setCategoriaFiltro(valor);
    setPagina(1);
  };

  const manejarEliminar = async (
    producto: Producto,
  ) => {
    const confirmar =
      window.confirm(
        `¿Seguro que deseas eliminar "${producto.nombre}"?`,
      );

    if (!confirmar) {
      return;
    }

    await eliminarProducto(producto);
  };

  const hayFiltros =
    Boolean(busqueda.trim()) ||
    categoriaFiltro !== "todas";

  if (cargando) {
    return <InventarioLoading />;
  }

  return (
    <main className="min-h-full px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <InventarioHeader
          onCrear={abrirCrear}
        />

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="font-semibold hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        <InventarioFiltros
          busqueda={busqueda}
          categoria={categoriaFiltro}
          onBusquedaChange={
            cambiarBusqueda
          }
          onCategoriaChange={
            cambiarCategoria
          }
        />

        <div className="overflow-hidden rounded-2xl border border-[#E4DED3] bg-white shadow-sm">
          {productosPagina.length ===
          0 ? (
            <InventarioEmpty
              filtrado={hayFiltros}
            />
          ) : (
            <>
              <InventarioTabla
                productos={productosPagina}
                onEditar={abrirEditar}
                onEliminar={
                  manejarEliminar
                }
              />

              <InventarioMobile
                productos={productosPagina}
                onEditar={abrirEditar}
                onEliminar={
                  manejarEliminar
                }
              />

              <InventarioPaginacion
                total={
                  productosFiltrados.length
                }
                paginaActual={
                  paginaActual
                }
                totalPaginas={
                  totalPaginas
                }
                onPaginaAnterior={() =>
                  setPagina(
                    (actual) =>
                      Math.max(
                        1,
                        actual - 1,
                      ),
                  )
                }
                onPaginaSiguiente={() =>
                  setPagina(
                    (actual) =>
                      Math.min(
                        totalPaginas,
                        actual + 1,
                      ),
                  )
                }
              />
            </>
          )}
        </div>
      </div>

      <ProductoDialog
        abierto={modalAbierto}
        guardando={guardando}
        formulario={formulario}
        productoEditando={
          productoEditando
        }
        onCerrar={cerrarModal}
        onGuardar={guardarProducto}
        onCampoChange={
          cambiarCampo
        }
      />
    </main>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";

import PlatosHeader from "./components/PlatosHeader";
import PlatosFiltros from "./components/PlatosFiltros";
import PlatosLista from "./components/PlatosLista";
import PlatosPaginacion from "./components/PlatosPaginacion";
import PlatoDialog from "./components/PlatoDialog";
import PlatosLoading from "./components/PlatosLoading";
import PlatosError from "./components/PlatosError";

import {
  PLATOS_POR_PAGINA,
} from "./constants/constants";

import { usePlatos } from "./hooks/usePlatos";

import type { Plato } from "./types/types";

export default function PlatosPage() {
  const {
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
  } = usePlatos();

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] =
    useState("todas");

  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    void cargarPlatos();
  }, [cargarPlatos]);

  const platosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return platos.filter((plato) => {
      const coincideBusqueda = plato.nombre
        .toLowerCase()
        .includes(texto);

      const coincideCategoria =
        filtroCategoria === "todas" ||
        plato.categoria === filtroCategoria;

      return coincideBusqueda && coincideCategoria;
    });
  }, [
    platos,
    busqueda,
    filtroCategoria,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      platosFiltrados.length /
        PLATOS_POR_PAGINA,
    ),
  );

  const paginaActual = Math.min(
    pagina,
    totalPaginas,
  );

  const platosPagina = useMemo(() => {
    const inicio =
      (paginaActual - 1) *
      PLATOS_POR_PAGINA;

    return platosFiltrados.slice(
      inicio,
      inicio + PLATOS_POR_PAGINA,
    );
  }, [
    platosFiltrados,
    paginaActual,
  ]);

  const rangoInicio =
    platosFiltrados.length === 0
      ? 0
      : (paginaActual - 1) *
          PLATOS_POR_PAGINA +
        1;

  const rangoFin = Math.min(
    paginaActual * PLATOS_POR_PAGINA,
    platosFiltrados.length,
  );

  const manejarEliminar = async (
    plato: Plato,
  ) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${plato.nombre}"?`,
    );

    if (!confirmar) {
      return;
    }

    const eliminado = await eliminar(plato);

    if (
      eliminado &&
      platoEditando?.id === plato.id
    ) {
      cerrarDialogo();
    }
  };

  if (loading) {
    return <PlatosLoading />;
  }

  return (
    <main className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <PlatosHeader
          onCrear={abrirCrear}
        />

        {error && (
          <PlatosError
            mensaje={error}
            onCerrar={() => setError(null)}
          />
        )}

        <PlatosFiltros
          busqueda={busqueda}
          categoria={filtroCategoria}
          onBusquedaChange={(valor) => {
            setBusqueda(valor);
            setPagina(1);
          }}
          onCategoriaChange={(valor) => {
            setFiltroCategoria(valor);
            setPagina(1);
          }}
        />

        <PlatosLista
          platos={platosPagina}
          busqueda={busqueda}
          categoria={filtroCategoria}
          onEditar={abrirEditar}
          onCambiarDisponibilidad={
            cambiarDisponibilidad
          }
          onEliminar={manejarEliminar}
        />

        <PlatosPaginacion
          total={platosFiltrados.length}
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          rangoInicio={rangoInicio}
          rangoFin={rangoFin}
          onPaginaAnterior={() =>
            setPagina((actual) =>
              Math.max(
                1,
                actual - 1,
              ),
            )
          }
          onPaginaSiguiente={() =>
            setPagina((actual) =>
              Math.min(
                totalPaginas,
                actual + 1,
              ),
            )
          }
        />
      </div>

      <PlatoDialog
        abierto={dialogoAbierto}
        onAbiertoChange={
          setDialogoAbierto
        }
        platoEditando={
          platoEditando
        }
        formulario={formulario}
        setFormulario={
          setFormulario
        }
        guardando={guardando}
        onGuardar={guardar}
      />
    </main>
  );
}
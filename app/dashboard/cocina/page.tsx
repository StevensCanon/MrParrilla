"use client";

import CocinaColumna from "./components/CocinaColumna";
import CocinaError from "../cocina/components/CocinaError";
import CocinaHeader from "./components/CocinaHeader";
import CocinaLoading from "../cocina/components/CocinaLoading";
import CocinaResumen from "./components/CocinaResumen";

import { useCocina } from "./hooks/useCocina";

export default function CocinaPage( ) {
  const {
    comandasPendientes,
    comandasPreparando,
    comandasListas,
    loading,
    actualizando,
    error,
    accionando,
    actualizar,
    cambiarEstadoItem,
    archivarComanda,
  } = useCocina();

  if (loading) {
    return <CocinaLoading />;
  }

  return (
    <main className="min-h-screen bg-[#F8F8F6] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px]">
        <CocinaHeader
          actualizando={actualizando}
          onActualizar={actualizar}
        />

        {error && (
          <CocinaError mensaje={error} />
        )}

        <CocinaResumen
          pendientes={
            comandasPendientes.length
          }
          preparando={
            comandasPreparando.length
          }
          listas={comandasListas.length}
        />

        <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
          <CocinaColumna
            tipo="pendiente"
            comandas={comandasPendientes}
            accionando={accionando}
            onCambiarEstado={
              cambiarEstadoItem
            }
            onArchivar={
              archivarComanda
            }
          />

          <CocinaColumna
            tipo="preparando"
            comandas={comandasPreparando}
            accionando={accionando}
            onCambiarEstado={
              cambiarEstadoItem
            }
            onArchivar={
              archivarComanda
            }
          />

          <CocinaColumna
            tipo="listo"
            comandas={comandasListas}
            accionando={accionando}
            onCambiarEstado={
              cambiarEstadoItem
            }
            onArchivar={
              archivarComanda
            }
          />
        </section>
      </div>
    </main>
  );
}
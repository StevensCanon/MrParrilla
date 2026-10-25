"use client";

import CocinaColumna from "./components/CocinaColumna";
import CocinaError from "../cocina/components/CocinaError";
import CocinaHeader from "./components/CocinaHeader";
import CocinaLoading from "../cocina/components/CocinaLoading";


import { useCocina } from "./hooks/useCocina";

export default function CocinaPage() {
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
    <main className="min-h-screen  px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1920px]">
        <CocinaHeader actualizando={actualizando} onActualizar={actualizar} />

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-5 text-[#6F695E]">
            Gestiona las preparaciones desde aqui.
          </p>
        </div>


        {error && <CocinaError mensaje={error} />}

        <section aria-label="Comandas por estado" className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3 mt-10">
          <CocinaColumna
            tipo="pendiente"
            comandas={comandasPendientes}
            accionando={accionando}
            onCambiarEstado={cambiarEstadoItem}
            onArchivar={archivarComanda}
          />

          <CocinaColumna
            tipo="preparando"
            comandas={comandasPreparando}
            accionando={accionando}
            onCambiarEstado={cambiarEstadoItem}
            onArchivar={archivarComanda}
          />

          <CocinaColumna
            tipo="listo"
            comandas={comandasListas}
            accionando={accionando}
            onCambiarEstado={cambiarEstadoItem}
            onArchivar={archivarComanda}
          />
        </section>
      </div>
    </main>
  );
}

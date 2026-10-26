"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import {
  ConfiguracionSidebar,
  seccionesConfiguracion,
} from "./components/ConfiguracionSidebar";
import { ConfiguracionHeader } from "./components/ConfiguracionHeader";
import { UsuariosSection } from "./components/UsuariosSection";
import { DatosRestauranteSection } from "./components/DatosRestauranteSection";
import { OperacionSection } from "./components/OperacionSection";
import { AparienciaSection } from "./components/AparienciaSection";

import { useAdminUsuarios } from "./hooks/useAdminUsuarios";
import type { SeccionId } from "./types/configuracion";

export default function ConfiguracionPage() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionId>("usuarios");

  const {
    usuarios,
    usuarioActualId,
    cargando,
    guardando,
    error,
    mensaje,
    setError,
    setMensaje,
    crearUsuario,
    actualizarUsuario,
    restablecerPin,
    cambiarCampoUsuario,
  } = useAdminUsuarios();

  const seccionSeleccionada =
    seccionesConfiguracion.find((seccion) => seccion.id === seccionActiva) ??
    seccionesConfiguracion[0];

  const seleccionarSeccion = (id: SeccionId) => {
    setSeccionActiva(id);
    setError("");
    setMensaje("");
  };

  if (cargando) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-[#6F695E]">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Cargando configuración…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)]  ">
      <div className="mx-auto grid max-w-[1600px] min-w-0 gap-0 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <ConfiguracionSidebar
          activa={seccionActiva}
          onSeleccionar={seleccionarSeccion}
        />

        <div
          id="configuracion-panel"
          className="min-w-0 px-4 py-5 sm:px-6 lg:px-8"
        >
          <ConfiguracionHeader
            seccion={seccionSeleccionada}
            cantidadUsuarios={usuarios.length}
          />

          {error && (
            <div
              role="alert"
              className="mt-5 border-l-2 border-[#E8B7AA] bg-[#FBEDEA] px-4 py-3 text-sm text-[#B3261E]"
            >
              {error}
            </div>
          )}

          {mensaje && (
            <div
              role="status"
              className="mt-5 border-l-2 border-[#C9DED1] bg-[#EFF8F2] px-4 py-3 text-sm text-[#2E6B4F]"
            >
              {mensaje}
            </div>
          )}

          <div className="mt-6">
            {seccionActiva === "usuarios" && (
              <UsuariosSection
                usuarios={usuarios}
                usuarioActualId={usuarioActualId}
                guardando={guardando}
                onCrear={crearUsuario}
                onCambiar={cambiarCampoUsuario}
                onGuardar={actualizarUsuario}
                onRestablecerPin={restablecerPin}
              />
            )}

            {seccionActiva === "datos" && <DatosRestauranteSection />}
            {seccionActiva === "operacion" && <OperacionSection />}
            {seccionActiva === "apariencia" && <AparienciaSection />}
          </div>
        </div>
      </div>
    </main>
  );
}

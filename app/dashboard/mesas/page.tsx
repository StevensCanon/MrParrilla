"use client";

import {
  Plus,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useMesasPage } from "../mesas/hooks/UseMesasPage";

import { MesasGrid } from "./components/MesasGrid";
import { CrearMesaDialog } from "./components/CrearMesaDialog";
import { EditarMesaDialog } from "./components/EditarMesaDialog";
import { DetalleMesaCajeroDialog } from "./components/DetalleMesaCajeroDialog";
import { PagoEfectivoDialog } from "./components/PagoEfectivoDialog";
import { ComandaDialog } from "./components/ComandaDialog";
import { ConfigurarPlatoDialog } from "./components/ConfigurarPlatoDialog";
import { PagoTransferenciaDialog } from "./components/PagoTransferenciaDialog";

export default function MesasPage() {
  const mesas = useMesasPage();

  if (mesas.loading) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <div className="flex items-center gap-2 text-sm text-[#8A8375]">
          <Loader2
            size={16}
            className="animate-spin"
          />

          Cargando mesas...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl text-[#22201D]">
            Mesas
          </h1>

          <p className="mt-1 text-sm text-[#8A8375]">
            {mesas.esCajero
              ? "Consulta el consumo y total de las mesas ocupadas."
              : "Selecciona una mesa para crear o continuar una comanda."}
          </p>
        </div>

        {mesas.esAdmin && (
          <Button
            type="button"
            onClick={
              mesas.abrirCrearMesa
            }
            className="cursor-pointer bg-[#22201D] text-white hover:bg-[#3A3732]"
          >
            <Plus size={16} />
            Nueva mesa
          </Button>
        )}
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {mesas.error && (
        <div className="flex items-center justify-between border border-[#E7B8AD] bg-[#FFF5F2] px-4 py-3 text-sm text-[#A3402A]">
          <span>{mesas.error}</span>

          <button
            type="button"
            onClick={() =>
              mesas.setError(null)
            }
            className="ml-4 text-xs underline"
          >
            cerrar
          </button>
        </div>
      )}

      {/* =====================================================
          ESTADOS
      ===================================================== */}

      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 rounded-full bg-[#E8F1EC] px-3 py-1.5 text-[#2E6B4F]">
          <span className="size-2 rounded-full bg-[#2E6B4F]" />

          {
            mesas.mesas.filter(
              (mesa) =>
                !mesas.estaOcupada(
                  mesa.id,
                ),
            ).length
          }{" "}
          libres
        </div>

        <div className="flex items-center gap-2 rounded-full bg-[#F1EEEA] px-3 py-1.5 text-[#6F695E]">
          <span className="size-2 rounded-full bg-[#6F695E]" />

          {
            mesas.mesas.filter(
              (mesa) =>
                mesas.estaOcupada(
                  mesa.id,
                ),
            ).length
          }{" "}
          ocupadas
        </div>
      </div>

      {/* =====================================================
          GRID
      ===================================================== */}

      <MesasGrid
        mesas={mesas.mesas}
        esAdmin={mesas.esAdmin}
        esCajero={mesas.esCajero}
        eliminandoMesa={
          mesas.eliminandoMesa
        }
        estaOcupada={
          mesas.estaOcupada
        }
        obtenerTotalMesa={
          mesas.obtenerTotalMesa
        }
        onAbrirMesa={
          mesas.abrirMesa
        }
        onEditarMesa={
          mesas.abrirEditarMesa
        }
        onEliminarMesa={
          mesas.eliminarMesa
        }
      />

      {/* =====================================================
          CREAR MESA
      ===================================================== */}

      <CrearMesaDialog
        open={
          mesas.dialogoCrearMesa
        }
        numeroMesa={
          mesas.numeroMesa
        }
        creando={
          mesas.creandoMesa
        }
        onOpenChange={
          mesas.setDialogoCrearMesa
        }
        onNumeroChange={
          mesas.setNumeroMesa
        }
        onCrear={() =>
          void mesas.crearMesa()
        }
      />

      {/* =====================================================
          EDITAR MESA
      ===================================================== */}

      <EditarMesaDialog
        open={
          mesas.dialogoEditarMesa
        }
        numeroMesa={
          mesas.numeroMesa
        }
        guardando={
          mesas.guardando
        }
        onOpenChange={
          mesas.setDialogoEditarMesa
        }
        onNumeroChange={
          mesas.setNumeroMesa
        }
        onGuardar={() =>
          void mesas.editarMesa()
        }
      />

      {/* =====================================================
          DETALLE CAJERO
      ===================================================== */}

      <DetalleMesaCajeroDialog
        open={
          mesas.dialogoDetalleCajero
        }
        mesa={
          mesas.mesaDetalleCajero
        }
        platos={mesas.platos}
        items={
          mesas.mesaDetalleCajero
            ? mesas.obtenerItemsMesa(
                mesas.mesaDetalleCajero.id,
              )
            : []
        }
        total={
          mesas.totalMesaCajero
        }
        onClose={
          mesas.cerrarDetalleCajero
        }
        onPagar={
          mesas.abrirPagoEfectivo
        }
        onPagarTransferencia={
          mesas.abrirPagoTransferencia
        }
      />

      {/* =====================================================
          PAGO EN EFECTIVO
      ===================================================== */}

      <PagoEfectivoDialog
        open={
          mesas.dialogoPagoEfectivo
        }
        total={
          mesas.totalMesaCajero
        }
        montoRecibido={
          mesas.montoRecibido
        }
        pagando={
          mesas.pagando
        }
        onClose={
          mesas.cerrarPagoEfectivo
        }
        onMontoRecibidoChange={
          mesas.setMontoRecibido
        }
        onConfirmar={() =>
          void mesas.confirmarPagoEfectivo()
        }
      />

      {/* =====================================================
          PAGO POR TRANSFERENCIA
      ===================================================== */}

      <PagoTransferenciaDialog
        open={mesas.dialogoPagoTransferencia}
        total={mesas.totalMesaCajero}
        pagando={mesas.pagando}
        onClose={mesas.cerrarPagoTransferencia}
        onConfirmar={() =>
          void mesas.confirmarPagoTransferencia()
        }
      />

      {/* =====================================================
          COMANDA
      ===================================================== */}

      <ComandaDialog
        open={
          mesas.dialogoAbierto
        }
        mesa={
          mesas.mesaSeleccionada
        }
        estaOcupada={
          mesas.mesaSeleccionada
            ? mesas.estaOcupada(
                mesas
                  .mesaSeleccionada
                  .id,
              )
            : false
        }
        items={
          mesas.itemsSeleccionados
        }
        categorias={
          mesas.platosPorCategoria
        }
        platosFiltrados={
          mesas.platosFiltrados
        }
        busqueda={
          mesas.busqueda
        }
        total={mesas.total}
        guardando={
          mesas.guardando
        }
        onClose={
          mesas.cerrarDialogo
        }
        onBusquedaChange={
          mesas.setBusqueda
        }
        onAgregarPlato={(plato) =>
          void mesas.agregarPlato(
            plato,
          )
        }
        onQuitarPlato={
          mesas.quitarPlato
        }
        onIncrementar={
          mesas.incrementarItem
        }
        onDisminuir={
          mesas.disminuirItem
        }
        onEliminar={
          mesas.eliminarPlatoSeleccionado
        }
        onLiberarMesa={() =>
          void mesas.liberarMesa()
        }
        onConfirmar={() =>
          void mesas.confirmarComanda()
        }
      />

      {/* =====================================================
          CONFIGURAR PLATO
      ===================================================== */}

      <ConfigurarPlatoDialog
        open={
          mesas.dialogoArmarPlato
        }
        plato={
          mesas.platoConfigurando
        }
        configuracion={
          mesas.configuracionPlato
        }
        selecciones={
          mesas.seleccionesConfiguracion
        }
        observaciones={
          mesas.observacionesConfiguracion
        }
        cargando={
          mesas.cargandoConfiguracion
        }
        guardando={
          mesas.guardando
        }
        precio={
          mesas.precioConfigurando
        }
        onClose={
          mesas.cerrarConfiguradorPlato
        }
        onSeleccionar={
          mesas.seleccionarOpcion
        }
        onObservacionesChange={
          mesas.setObservacionesConfiguracion
        }
        onConfirmar={
          mesas.confirmarConfiguracionPlato
        }
      />
    </main>
  );
}
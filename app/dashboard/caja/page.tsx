"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  Banknote,
  Clock3,
  RefreshCw,
  Receipt,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AbrirTurnoDialog } from "./components/AbrirTurnoDialog";
import { CerrarTurnoDialog } from "./components/CerrarTurnoDialog";
import { RegistrarEgresoDialog } from "./components/RegistrarEgresoDialog";
import { useCajaPage } from "./hooks/useCajaPage";

type TabCaja = "relaciones" | "egresos";

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));

const fechaHora = (fecha: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));

export default function CajaPage() {
  const {
    turno,
    resumen,
    relaciones,
    egresos,
    cargandoRelaciones,
    cargandoEgresos,
    errorRelaciones,
    errorEgresos,
    abriendoComprobante,
    verComprobante,
    loading,
    cargandoResumen,
    abriendo,
    cerrando,
    registrandoEgreso,

    dialogoAbrir,
    dialogoCerrar,
    dialogoEgreso,

    error,

    setError,

    abrirDialogo,
    cerrarDialogo,
    abrirCaja,

    abrirDialogoCerrar,
    cerrarDialogoCerrar,
    cerrarCaja,

    abrirDialogoEgreso,
    cerrarDialogoEgreso,
    registrarEgreso,

    actualizar,
  } = useCajaPage();

  const [tabActiva, setTabActiva] =
    useState<TabCaja>("relaciones");

  const resumenActual = resumen ?? {
    turno_id: turno?.id ?? "",
    fondo_inicial: turno?.fondo_inicial ?? 0,
    ventas_efectivo: 0,
    ventas_transferencia: 0,
    ventas_tarjeta: 0,
    total_ventas: 0,
    total_egresos: 0,
    efectivo_esperado: turno?.efectivo_esperado ?? 0,
    cantidad_egresos: 0,
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-neutral-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Cargando caja...
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-black">
                Caja
              </h1>

              {turno && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Activo
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-neutral-500">
              Control operativo del turno
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void actualizar()}
              disabled={
                cargandoResumen ||
                abriendo ||
                cerrando ||
                registrandoEgreso
              }
              className="h-9 gap-2 border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  cargandoResumen ? "animate-spin" : ""
                }`}
              />
              Actualizar
            </Button>

            {turno ? (
              <Button
                type="button"
                onClick={abrirDialogoCerrar}
                disabled={cerrando || registrandoEgreso}
                className="h-9 gap-2 bg-black text-white hover:bg-neutral-800"
              >
                <Receipt className="h-4 w-4" />
                Cerrar caja
              </Button>
            ) : (
              <Button
                type="button"
                onClick={abrirDialogo}
                className="h-9 gap-2 bg-[#C62828] text-white hover:bg-[#A91F1F]"
              >
                <Banknote className="h-4 w-4" />
                Abrir caja
              </Button>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 font-semibold text-red-700 hover:text-red-900"
            >
              Cerrar
            </button>
          </div>
        )}

        {!turno ? (
          <section className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50">
              <Wallet className="h-7 w-7 text-yellow-600" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-black">
              No hay un turno activo
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Abre la caja para comenzar a registrar las operaciones
              del turno.
            </p>

            <Button
              type="button"
              onClick={abrirDialogo}
              className="mt-5 bg-[#C62828] text-white hover:bg-[#A91F1F]"
            >
              <Banknote className="mr-2 h-4 w-4" />
              Abrir caja
            </Button>
          </section>
        ) : (
          <>
            {/* Información inicial */}
            <section className="mb-7">
              <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-blue-400" />

                <div className="flex flex-col gap-5 p-5 pl-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <Banknote className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                        Fondo inicial
                      </p>

                      <p className="mt-1 text-2xl font-bold tracking-tight text-black">
                        {money(resumenActual.fondo_inicial)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Clock3 className="h-4 w-4" />

                    <span>
                      Apertura{" "}
                      <span className="font-medium text-neutral-700">
                        {fechaHora(turno.abierto_en)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Resumen */}
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-800">
                  Resumen
                </h2>

                {cargandoResumen && (
                  <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Ventas */}
                <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                  <div className="absolute left-0 right-0 top-0 h-1 bg-green-600" />

                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-600">
                        Ventas
                      </p>

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                    </div>

                    <p className="mt-4 text-2xl font-bold tracking-tight text-black">
                      {money(resumenActual.total_ventas)}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      Total vendido
                    </p>
                  </div>
                </div>

                {/* Egresos */}
                <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                  <div className="absolute left-0 right-0 top-0 h-1 bg-[#C62828]" />

                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-600">
                        Egresos
                      </p>

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                        <TrendingDown className="h-4 w-4 text-[#C62828]" />
                      </div>
                    </div>

                    <p className="mt-4 text-2xl font-bold tracking-tight text-black">
                      {money(resumenActual.total_egresos)}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      {resumenActual.cantidad_egresos}{" "}
                      {resumenActual.cantidad_egresos === 1
                        ? "movimiento"
                        : "movimientos"}
                    </p>
                  </div>
                </div>

                {/* Efectivo esperado */}
                <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                  <div className="absolute left-0 right-0 top-0 h-1 bg-yellow-400" />

                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-600">
                        Efectivo esperado
                      </p>

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50">
                        <Wallet className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>

                    <p className="mt-4 text-2xl font-bold tracking-tight text-black">
                      {money(resumenActual.efectivo_esperado)}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                      En caja
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Métodos de pago */}
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-800">
                Ventas por método
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Efectivo */}
                <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50">
                        <Banknote className="h-4 w-4 text-yellow-600" />
                      </div>

                      <span className="text-sm font-semibold text-neutral-700">
                        Efectivo
                      </span>
                    </div>

                    <span className="text-lg font-bold text-black">
                      {money(resumenActual.ventas_efectivo)}
                    </span>
                  </div>
                </div>

                {/* Transferencia */}
                <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                        <ArrowRightLeft className="h-4 w-4 text-[#C62828]" />
                      </div>

                      <span className="text-sm font-semibold text-neutral-700">
                        Transferencia
                      </span>
                    </div>

                    <span className="text-lg font-bold text-black">
                      {money(resumenActual.ventas_transferencia)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Tabs */}
            <section>
              <div className="border-b border-neutral-200">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setTabActiva("relaciones")}
                    className={`relative pb-3 text-sm font-semibold transition-colors ${
                      tabActiva === "relaciones"
                        ? "text-[#C62828]"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Relaciones
                    </span>

                    {tabActiva === "relaciones" && (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#C62828]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabActiva("egresos")}
                    className={`relative pb-3 text-sm font-semibold transition-colors ${
                      tabActiva === "egresos"
                        ? "text-[#C62828]"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Egresos
                    </span>

                    {tabActiva === "egresos" && (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#C62828]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-5">
                {tabActiva === "relaciones" ? (
                  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                    <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                      <div>
                        <h3 className="font-bold text-neutral-900">Comandas pagadas</h3>
                        <p className="mt-1 text-xs text-neutral-500">Pagos confirmados del turno actual · {relaciones.length} registros</p>
                      </div>
                    </div>
                    {cargandoRelaciones ? (
                      <div className="flex items-center justify-center gap-2 p-12 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando relaciones...</div>
                    ) : errorRelaciones ? (
                      <p className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{errorRelaciones}</p>
                    ) : relaciones.length === 0 ? (
                      <p className="p-12 text-center text-sm text-neutral-500">Todavía no hay comandas pagadas en este turno.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr>
                            <th className="px-5 py-3">Mesa / comanda</th><th className="px-5 py-3">Fecha y hora</th><th className="px-5 py-3">Método</th><th className="px-5 py-3 text-right">Total</th>
                          </tr></thead>
                          <tbody className="divide-y divide-neutral-100">
                            {relaciones.map((pago) => (
                              <tr key={pago.id} className="hover:bg-neutral-50">
                                <td className="px-5 py-4"><p className="font-semibold text-neutral-900">{pago.mesa_nombre ? `Mesa ${pago.mesa_nombre}` : pago.mesa_id ? `Mesa ${pago.mesa_id.slice(0, 8)}` : "Sin mesa"}</p><p className="mt-1 font-mono text-xs text-neutral-500" title={pago.comanda_id}>Comanda {pago.comanda_id.slice(0, 8)}</p></td>
                                <td className="px-5 py-4 text-neutral-600">{fechaHora(pago.creado_en)}</td>
                                <td className="px-5 py-4"><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">{pago.metodo_pago}</span>{pago.metodo_pago === "efectivo" && pago.monto_recibido != null && <p className="mt-2 text-xs text-neutral-500">Recibido: {money(pago.monto_recibido)} · Cambio: {money(pago.cambio ?? 0)}</p>}</td>
                                <td className="px-5 py-4 text-right font-bold text-neutral-900">{money(pago.monto)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
                      <div><h3 className="font-bold text-neutral-900">Egresos del turno</h3><p className="mt-1 text-xs text-neutral-500">{egresos.length} movimientos registrados</p></div>
                      <Button type="button" onClick={abrirDialogoEgreso} disabled={registrandoEgreso} className="bg-[#C62828] text-white hover:bg-[#A91F1F]"><TrendingDown className="mr-2 h-4 w-4" /> Registrar egreso</Button>
                    </div>
                    {cargandoEgresos ? (
                      <div className="flex items-center justify-center gap-2 p-12 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando egresos...</div>
                    ) : errorEgresos ? (
                      <p className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{errorEgresos}</p>
                    ) : egresos.length === 0 ? (
                      <p className="p-12 text-center text-sm text-neutral-500">Todavía no hay egresos registrados en este turno.</p>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {egresos.map((egreso) => (
                          <div key={egreso.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                            <div className="min-w-0"><p className="font-semibold text-neutral-900">{egreso.concepto}</p><p className="mt-1 text-xs text-neutral-500">{egreso.categoria} · {fechaHora(egreso.creado_en)}</p>{egreso.observacion && <p className="mt-2 text-xs text-neutral-600">{egreso.observacion}</p>}</div>
                            <div className="flex items-center gap-4"><span className="font-bold text-[#C62828]">-{money(egreso.monto)}</span>{egreso.comprobante_path && <Button type="button" variant="outline" size="sm" onClick={() => void verComprobante(egreso)} disabled={abriendoComprobante === egreso.id} className="gap-2">{abriendoComprobante === egreso.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Comprobante</Button>}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Dialogos */}
      <AbrirTurnoDialog
        open={dialogoAbrir}
        abriendo={abriendo}
        onClose={cerrarDialogo}
        onConfirmar={abrirCaja}
      />

      <CerrarTurnoDialog
        open={dialogoCerrar}
        cerrando={cerrando}
        efectivoEsperado={resumenActual.efectivo_esperado}
        onClose={cerrarDialogoCerrar}
        onConfirmar={cerrarCaja}
      />

      <RegistrarEgresoDialog
        open={dialogoEgreso}
        registrando={registrandoEgreso}
        efectivoDisponible={resumenActual.efectivo_esperado}
        onClose={cerrarDialogoEgreso}
        onConfirmar={registrarEgreso}
      />
    </main>
  );
}
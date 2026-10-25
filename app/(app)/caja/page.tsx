"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRightLeft,
  Banknote,
  Clock3,
  FileText,
  Loader2,
  Receipt,
  RefreshCw,
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
  })
    .format(Math.round(value || 0))
    .replace(/\s/g, "");

const fechaHora = (fecha: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));

const fechaPago = (fecha: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(fecha));

const horaPago = (fecha: string) =>
  new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(fecha));

const tituloDeMesa = (nombre?: string | null, id?: string | null) => {
  const limpio = nombre?.trim();
  if (limpio) return /^mesa\s/i.test(limpio) ? limpio : `Mesa ${limpio}`;
  return id ? `Mesa ${id.slice(0, 8)}` : "Sin mesa";
};

/* ---------- Piezas de la tabla de relaciones ---------- */

const numeroMesa = (titulo: string) => {
  const t = titulo.replace(/^mesa\s+/i, "").trim();
  return t.length > 0 && t.length <= 3 ? t : null;
};

function Insignia({
  texto,
  tipo,
}: {
  texto: string | null;
  tipo: "mesa" | "persona";
}) {
  if (tipo === "persona") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
        {texto ?? <Receipt className="h-3.5 w-3.5" />}
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-sm font-semibold text-white">
      {texto ?? <Receipt className="h-4 w-4" />}
    </span>
  );
}

function IconoTarjeta({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
      {children}
    </span>
  );
}



const COLUMNAS = "md:grid-cols-[1.2fr_1.5fr_1fr_0.9fr]";

function MetodoPago({
  metodo,
  recibido,
  cambio,
}: {
  metodo: string;
  recibido?: number | null;
  cambio?: number | null;
}) {
  const esEfectivo = metodo === "efectivo";
  const Icono = esEfectivo ? Banknote : ArrowRightLeft;

  return (
    <div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
          esEfectivo
            ? "bg-neutral-100 text-neutral-800"
            : "bg-red-50 text-[#A91F1F]"
        }`}
      >
        <Icono className="h-3.5 w-3.5" />
        {metodo}
      </span>
      {esEfectivo && recibido != null && (
        <p className="mt-1.5 text-xs tabular-nums text-neutral-500">
          Recibido {money(recibido)} · Cambio {money(cambio ?? 0)}
        </p>
      )}
    </div>
  );
}

function Fila({
  insignia,
  nombre,
  detalle,
  metodo,
  recibido,
  cambio,
  fecha,
  total,
  nivel,
}: {
  insignia?: ReactNode;
  nombre: string;
  detalle?: string;
  metodo?: string | null;
  recibido?: number | null;
  cambio?: number | null;
  fecha: string;
  total: number;
  nivel: "grupo" | "pago" | "unico";
}) {
  const esPago = nivel === "pago";

  return (
    <div
      className={`grid grid-cols-2 items-start gap-x-4 gap-y-3 py-4 pr-4 md:items-center md:pr-6 ${COLUMNAS} ${
        esPago ? "pl-7 md:pl-10" : "pl-4 md:pl-6"
      } ${nivel === "grupo" ? "bg-neutral-50" : ""}`}
    >
      <div className="order-1 flex min-w-0 items-center gap-3 md:order-none">
        {insignia}
        <div className="min-w-0">
          <p
            className={`truncate text-neutral-900 ${
              esPago ? "text-sm font-medium" : "text-base font-semibold"
            }`}
          >
            {nombre}
          </p>
          {detalle && (
            <p className="mt-0.5 text-xs text-neutral-500">{detalle}</p>
          )}
        </div>
      </div>

      <div className="order-3 md:order-none">
        {metodo ? (
          <MetodoPago metodo={metodo} recibido={recibido} cambio={cambio} />
        ) : null}
      </div>

      <div className="order-4 text-right md:order-none md:text-left">
        <p className="text-sm font-medium text-neutral-800">
          {fechaPago(fecha)}
        </p>
        <p className="text-xs text-neutral-500">{horaPago(fecha)}</p>
      </div>

      <p
        className={`order-2 text-right tabular-nums text-neutral-900 md:order-none ${
          esPago ? "text-sm font-medium" : "text-lg font-semibold"
        }`}
      >
        {money(total)}
      </p>
    </div>
  );
}

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

  const [tabActiva, setTabActiva] = useState<TabCaja>("relaciones");

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

  const totalMetodos =
    resumenActual.ventas_efectivo + resumenActual.ventas_transferencia;
  const pctEfectivo =
    totalMetodos > 0 ? (resumenActual.ventas_efectivo / totalMetodos) * 100 : 0;
  const pctTransferencia = totalMetodos > 0 ? 100 - pctEfectivo : 0;


  const totalPagos = relaciones.reduce(
    (total, relacion) => total + relacion.pagos.length,
    0,
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
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
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Caja
              </h1>

              {turno && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Turno activo
                </span>
              )}
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
              {turno ? (
                <>
                  <Clock3 className="h-3.5 w-3.5" />
                  Turno abierto el {fechaHora(turno.abierto_en)}
                </>
              ) : (
                "Control operativo del turno"
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void actualizar()}
              disabled={
                cargandoResumen || abriendo || cerrando || registrandoEgreso
              }
              className="h-10 gap-2 border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 ${cargandoResumen ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>

            {turno ? (
              <Button
                type="button"
                onClick={abrirDialogoCerrar}
                disabled={cerrando || registrandoEgreso}
                className="h-10 gap-2 bg-neutral-900 text-white hover:bg-neutral-700 cursor-pointer"
              >
                <Receipt className="h-4 w-4" />
                Cerrar caja
              </Button>
            ) : (
              <Button
                type="button"
                onClick={abrirDialogo}
                className="h-10 gap-2 bg-[#C62828] text-white hover:bg-[#A91F1F] cursor-pointer"
              >
                <Banknote className="h-4 w-4" />
                Abrir caja
              </Button>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
          <section className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Wallet className="h-6 w-6 text-neutral-600" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-neutral-900">
              No hay un turno activo
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              Abre la caja con el fondo inicial para empezar a registrar ventas
              y egresos.
            </p>

            <Button
              type="button"
              onClick={abrirDialogo}
              className="mt-6 gap-2 bg-[#C62828] text-white hover:bg-[#A91F1F]"
            >
              <Banknote className="h-4 w-4" />
              Abrir caja
            </Button>
          </section>
        ) : (
          <>
            {/* Resumen del turno */}
            <section className="mb-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white via-white to-red-50/70 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <IconoTarjeta>
                    <Wallet className="h-5 w-5" />
                  </IconoTarjeta>
                  <p className="flex-1 text-sm font-medium text-neutral-600">
                    Efectivo en caja
                  </p>
                  {cargandoResumen && (
                    <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
                  )}
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900">
                  {money(resumenActual.efectivo_esperado)}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Fondo inicial {money(resumenActual.fondo_inicial)}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <IconoTarjeta>
                    <TrendingUp className="h-5 w-5" />
                  </IconoTarjeta>
                  <p className="text-sm font-medium text-neutral-600">Ventas</p>
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900">
                  {money(resumenActual.total_ventas)}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {Math.round(pctEfectivo)}% efectivo ·{" "}
                  {Math.round(pctTransferencia)}% transferencia
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <IconoTarjeta>
                    <TrendingDown className="h-5 w-5" />
                  </IconoTarjeta>
                  <p className="text-sm font-medium text-neutral-600">Egresos</p>
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900">
                  {money(resumenActual.total_egresos)}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {resumenActual.cantidad_egresos}{" "}
                  {resumenActual.cantidad_egresos === 1
                    ? "movimiento"
                    : "movimientos"}
                </p>
              </div>
            </section>

            {/* Pestañas */}
            <section>
              <div
                role="tablist"
                className="flex gap-6 border-b border-neutral-200"
              >
                {(
                  [
                    {
                      id: "relaciones",
                      etiqueta: "Relaciones",
                      icono: Receipt,
                      cantidad: relaciones.length,
                    },
                    {
                      id: "egresos",
                      etiqueta: "Egresos",
                      icono: TrendingDown,
                      cantidad: egresos.length,
                    },
                  ] as const
                ).map(({ id, etiqueta, icono: Icono, cantidad }) => {
                  const activa = tabActiva === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={activa}
                      onClick={() => setTabActiva(id)}
                      className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                        activa
                          ? "border-neutral-900 text-neutral-900"
                          : "border-transparent text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      <Icono className="h-4 w-4" />
                      {etiqueta}
                      <span className="rounded-full bg-neutral-100 px-1.5 text-xs tabular-nums text-neutral-600">
                        {cantidad}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                {tabActiva === "relaciones" ? (
                  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    <div className="border-b border-neutral-200 px-5 py-4 md:px-6">
                      <h3 className="font-semibold text-neutral-900">
                        Relaciones de pago
                      </h3>
                   
                    </div>

                    {cargandoRelaciones ? (
                      <div className="flex items-center justify-center gap-2 p-12 text-sm text-neutral-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando
                        relaciones...
                      </div>
                    ) : errorRelaciones ? (
                      <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        {errorRelaciones}
                      </p>
                    ) : relaciones.length === 0 ? (
                      <p className="p-12 text-center text-sm text-neutral-500">
                        Todavía no hay comandas pagadas en este turno.
                      </p>
                    ) : (
                      <>
                        {/* Encabezados de columna (solo escritorio) */}
                        <div
                          className={`hidden border-b border-neutral-200 py-3 pl-6 pr-6 text-xs font-medium text-neutral-500 md:grid ${COLUMNAS}`}
                        >
                          <div>Mesa</div>
                          <div>Método</div>
                          <div>Fecha y hora</div>
                          <div className="text-right">Total</div>
                        </div>

                        <div className="divide-y divide-neutral-200">
                          {relaciones.map((relacion) => {
                            const titulo = tituloDeMesa(
                              relacion.mesa_nombre,
                              relacion.mesa_id,
                            );
                            const dividida = relacion.pagos.length > 1;
                            const ultimoPago = relacion.pagos.reduce(
                              (a, b) =>
                                new Date(b.creado_en) > new Date(a.creado_en)
                                  ? b
                                  : a,
                            );

                            /* Cuenta pagada de una sola vez */
                            if (!dividida) {
                              const pago = relacion.pagos[0];
                              return (
                                <Fila
                                  key={relacion.comanda_id}
                                  nivel="unico"
                                  insignia={<Insignia tipo="mesa" texto={numeroMesa(titulo)} />}
                                  nombre={titulo}
                                  detalle={
                                    pago.persona_numero === null
                                      ? "Cuenta completa"
                                      : `Persona ${pago.persona_numero}`
                                  }
                                  metodo={pago.metodo_pago}
                                  recibido={pago.monto_recibido}
                                  cambio={pago.cambio}
                                  fecha={pago.creado_en}
                                  total={relacion.total}
                                />
                              );
                            }

                            /* Cuenta dividida: fila de la mesa + una por persona */
                            return (
                              <article key={relacion.comanda_id}>
                                <Fila
                                  nivel="grupo"
                                  insignia={<Insignia tipo="mesa" texto={numeroMesa(titulo)} />}
                                  nombre={titulo}
                                  detalle={`Cuenta dividida · ${relacion.pagos.length} pagos`}
                                  fecha={ultimoPago.creado_en}
                                  total={relacion.total}
                                />
                                <div className="divide-y divide-neutral-100">
                                  {relacion.pagos.map((pago) => (
                                    <Fila
                                      key={pago.id}
                                      nivel="pago"
                                      insignia={<Insignia tipo="persona" texto={pago.persona_numero === null ? null : String(pago.persona_numero)} />}
                                      nombre={
                                        pago.persona_numero === null
                                          ? "Cuenta completa"
                                          : `Persona ${pago.persona_numero}`
                                      }
                                      detalle={
                                        pago.platos.length > 0
                                          ? pago.platos.join(", ")
                                          : undefined
                                      }
                                      metodo={pago.metodo_pago}
                                      recibido={pago.monto_recibido}
                                      cambio={pago.cambio}
                                      fecha={pago.creado_en}
                                      total={pago.monto}
                                    />
                                  ))}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 md:px-6">
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          Egresos del turno
                        </h3>
                        <p className="mt-0.5 text-sm text-neutral-500">
                          {egresos.length}{" "}
                          {egresos.length === 1
                            ? "movimiento registrado"
                            : "movimientos registrados"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={abrirDialogoEgreso}
                        disabled={registrandoEgreso}
                        className="h-10 gap-2 bg-[#C62828] text-white hover:bg-[#A91F1F]"
                      >
                        <TrendingDown className="h-4 w-4" />
                        Registrar egreso
                      </Button>
                    </div>

                    {cargandoEgresos ? (
                      <div className="flex items-center justify-center gap-2 p-12 text-sm text-neutral-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando
                        egresos...
                      </div>
                    ) : errorEgresos ? (
                      <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        {errorEgresos}
                      </p>
                    ) : egresos.length === 0 ? (
                      <p className="p-12 text-center text-sm text-neutral-500">
                        Todavía no hay egresos registrados en este turno.
                      </p>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {egresos.map((egreso) => (
                          <div
                            key={egreso.id}
                            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 md:px-6"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-neutral-900">
                                {egreso.concepto}
                              </p>
                              <p className="mt-0.5 text-xs text-neutral-500">
                                {egreso.categoria} ·{" "}
                                {fechaHora(egreso.creado_en)}
                              </p>
                              {egreso.observacion && (
                                <p className="mt-1.5 text-sm text-neutral-600">
                                  {egreso.observacion}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-base font-semibold tabular-nums text-neutral-900">
                                − {money(egreso.monto)}
                              </span>
                              {egreso.comprobante_path && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void verComprobante(egreso)}
                                  disabled={abriendoComprobante === egreso.id}
                                  className="gap-2 border-neutral-200"
                                >
                                  {abriendoComprobante === egreso.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <FileText className="h-4 w-4" />
                                  )}
                                  Comprobante
                                </Button>
                              )}
                            </div>
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

      {/* Diálogos */}
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
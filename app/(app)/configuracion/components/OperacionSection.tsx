"use client";

import { Loader2, Save, Settings2 } from "lucide-react";
import { useConfiguracionRestaurante } from "../hooks/useConfiguracionRestaurante";

const field = "mt-1.5 h-11 w-full rounded-lg border border-[#E7E1D7] bg-transparent px-3 text-sm text-[#22201D] outline-none transition focus:border-[#C85C3D] focus:ring-2 focus:ring-[#C85C3D]/15";

export function OperacionSection() {
  const { configuracion, cargando, guardando, error, mensaje, cambiarCampo, guardar } = useConfiguracionRestaurante();

  if (cargando) return <div className="py-12 text-sm text-[#6F695E]">Cargando preferencias de operación…</div>;

  return (
    <section className="max-w-4xl">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7DF] text-[#94691D]"><Settings2 size={18} aria-hidden="true" /></span>
        <div>
          <h2 className="text-base font-semibold text-[#22201D]">Alertas y actualización de cocina</h2>
          <p className="mt-1 text-sm text-[#6F695E]">Controla cuándo se marca una comanda como demorada y cada cuánto se consultan los pedidos.</p>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 border-l-2 border-[#E8B7AA] bg-[#FBEDEA] px-4 py-3 text-sm text-[#B3261E]">{error}</p>}
      {mensaje && <p role="status" className="mb-4 border-l-2 border-[#C9DED1] bg-[#EFF8F2] px-4 py-3 text-sm text-[#2E6B4F]">{mensaje}</p>}

      <form onSubmit={guardar} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#22201D]">Alerta de demora
            <span className="relative mt-1.5 block">
              <input type="number" required min={1} max={180} step={1} value={configuracion.umbral_demora_minutos} onChange={(event) => cambiarCampo("umbral_demora_minutos", Number(event.target.value))} className={`${field} pr-20`} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6F695E]">minutos</span>
            </span>
            <span className="mt-1 block text-xs font-normal text-[#6F695E]">La cocina resalta en rojo las comandas pendientes que superen este tiempo.</span>
          </label>

          <label className="text-sm font-medium text-[#22201D]">Actualizar comandas cada
            <span className="relative mt-1.5 block">
              <input type="number" required min={5} max={120} step={1} value={configuracion.intervalo_actualizacion_segundos} onChange={(event) => cambiarCampo("intervalo_actualizacion_segundos", Number(event.target.value))} className={`${field} pr-20`} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6F695E]">segundos</span>
            </span>
            <span className="mt-1 block text-xs font-normal text-[#6F695E]">Un intervalo corto muestra cambios antes y aumenta las consultas al sistema.</span>
          </label>
        </div>

        <div className="flex justify-end border-t border-[#E7E1D7] pt-4">
          <button type="submit" disabled={guardando} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#A3402A] px-4 text-sm font-semibold text-white transition hover:bg-[#87351F] disabled:cursor-not-allowed disabled:opacity-60">
            {guardando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </section>
  );
}

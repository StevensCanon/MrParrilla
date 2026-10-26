"use client";

import { Loader2, Save, Store } from "lucide-react";
import { useConfiguracionRestaurante } from "../hooks/useConfiguracionRestaurante";

const field = "mt-1.5 h-11 w-full rounded-lg border border-[#E7E1D7] bg-transparent px-3 text-sm text-[#22201D] outline-none transition placeholder:text-[#6F695E] focus:border-[#C85C3D] focus:ring-2 focus:ring-[#C85C3D]/15";

export function DatosRestauranteSection() {
  const { configuracion, cargando, guardando, error, mensaje, cambiarCampo, guardar } = useConfiguracionRestaurante();

  if (cargando) return <div className="py-12 text-sm text-[#6F695E]">Cargando datos del restaurante…</div>;

  return (
    <section className="max-w-4xl">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EA] text-[#A3402A]"><Store size={18} aria-hidden="true" /></span>
        <div>
          <h2 className="text-base font-semibold text-[#22201D]">Identidad y contacto</h2>
          <p className="mt-1 text-sm text-[#6F695E]">Estos datos sirven para identificar el negocio dentro de MrParrilla.</p>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 border-l-2 border-[#E8B7AA] bg-[#FBEDEA] px-4 py-3 text-sm text-[#B3261E]">{error}</p>}
      {mensaje && <p role="status" className="mb-4 border-l-2 border-[#C9DED1] bg-[#EFF8F2] px-4 py-3 text-sm text-[#2E6B4F]">{mensaje}</p>}

      <form onSubmit={guardar} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[#22201D] sm:col-span-2">Nombre comercial
            <input required minLength={2} maxLength={120} value={configuracion.nombre} onChange={(event) => cambiarCampo("nombre", event.target.value)} className={field} />
          </label>
          <label className="text-sm font-medium text-[#22201D]">NIT <span className="font-normal text-[#6F695E]">(opcional)</span>
            <input maxLength={180} value={configuracion.nit} onChange={(event) => cambiarCampo("nit", event.target.value)} placeholder="Número de identificación tributaria" className={field} />
          </label>
          <label className="text-sm font-medium text-[#22201D]">Teléfono <span className="font-normal text-[#6F695E]">(opcional)</span>
            <input type="tel" maxLength={180} value={configuracion.telefono} onChange={(event) => cambiarCampo("telefono", event.target.value)} placeholder="+57 300 123 4567" className={field} />
          </label>
          <label className="text-sm font-medium text-[#22201D] sm:col-span-2">Correo de contacto <span className="font-normal text-[#6F695E]">(opcional)</span>
            <input type="email" maxLength={180} value={configuracion.correo} onChange={(event) => cambiarCampo("correo", event.target.value)} placeholder="contacto@restaurante.com" className={field} />
          </label>
          <label className="text-sm font-medium text-[#22201D] sm:col-span-2">Dirección <span className="font-normal text-[#6F695E]">(opcional)</span>
            <textarea maxLength={180} rows={3} value={configuracion.direccion} onChange={(event) => cambiarCampo("direccion", event.target.value)} placeholder="Dirección del restaurante" className="mt-1.5 w-full resize-y rounded-lg border border-[#E7E1D7] bg-transparent px-3 py-2.5 text-sm text-[#22201D] outline-none transition placeholder:text-[#6F695E] focus:border-[#C85C3D] focus:ring-2 focus:ring-[#C85C3D]/15" />
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

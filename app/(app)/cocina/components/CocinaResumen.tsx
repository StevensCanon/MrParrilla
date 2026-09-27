import {
    Check,
    Clock3,
    Utensils,
  } from "lucide-react";
  
  type CocinaResumenProps = {
    pendientes: number;
    preparando: number;
    listas: number;
  };
  
  export default function CocinaResumen({
    pendientes,
    preparando,
    listas,
  }: CocinaResumenProps) {
    const tarjetas = [
      {
        titulo: "Pendientes",
        cantidad: pendientes,
        icono: Clock3,
        fondo: "bg-[#FFF3EF]",
        iconoFondo: "bg-[#FCE7E1]",
        iconoColor: "text-[#A3402A]",
      },
      {
        titulo: "En preparación",
        cantidad: preparando,
        icono: Utensils,
        fondo: "bg-[#FFF8E8]",
        iconoFondo: "bg-[#F7EBCB]",
        iconoColor: "text-[#94691D]",
      },
      {
        titulo: "Listos",
        cantidad: listas,
        icono: Check,
        fondo: "bg-[#EFF8F2]",
        iconoFondo: "bg-[#DDEFE3]",
        iconoColor: "text-[#2E6B4F]",
      },
    ];
  
    return (
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono;
  
          return (
            <div
              key={tarjeta.titulo}
              className={`rounded-2xl border border-black/5 p-4 ${tarjeta.fondo}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {tarjeta.titulo}
                  </p>
  
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {tarjeta.cantidad}
                  </p>
                </div>
  
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${tarjeta.iconoFondo} ${tarjeta.iconoColor}`}
                >
                  <Icono className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>
    );
  }
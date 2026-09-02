"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Delete,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

type Usuario = {
  id: string;
  nombre: string;
  rol: string;
};

const RUTA_POR_ROL: Record<string, string> = {
  admin: "/dashboard",
  cajero: "/dashboard",
  mesero: "/dashboard",
  cocina: "/dashboard",
};

const TECLAS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "",
  "0",
  "borrar",
];

const ROL_LABEL: Record<string, string> = {
  admin: "Administración",
  cajero: "Cajero",
  mesero: "Mesero",
  cocina: "Cocina",
};

function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function nombreRol(rol: string) {
  return ROL_LABEL[rol.toLowerCase()] ?? rol;
}

export default function LoginPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // ============================================================
  // CARGAR USUARIOS
  // ============================================================

  useEffect(() => {
    async function cargarUsuarios() {
      const { data, error } = await supabase.rpc("usuarios_para_login");

      if (!error) {
        setUsuarios(data || []);
      }
    }

    void cargarUsuarios();
  }, []);

  // ============================================================
  // TECLADO NUMÉRICO
  // ============================================================

  async function tecla(k: string) {
    setError("");

    if (k === "borrar") {
      setPin((actual) => actual.slice(0, -1));
      return;
    }

    if (pin.length >= 4 || !seleccionado) {
      return;
    }

    const nuevoPin = pin + k;

    setPin(nuevoPin);

    if (nuevoPin.length !== 4) {
      return;
    }

    setCargando(true);

    try {
      const res = await fetch("/api/login-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_id: seleccionado.id,
          pin: nuevoPin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "PIN incorrecto");
        setPin("");
        return;
      }

      sessionStorage.setItem("sesion", JSON.stringify(data));

      router.push(
        RUTA_POR_ROL[data.usuario.rol] || "/dashboard",
      );
    } catch {
      setError(
        "No se pudo conectar con el servidor.",
      );

      setPin("");
    } finally {
      setCargando(false);
    }
  }

  // ============================================================
  // CAMBIAR USUARIO
  // ============================================================

  function cambiarUsuario() {
    setSeleccionado(null);
    setPin("");
    setError("");
  }

  // ============================================================
  // SELECCIÓN DE USUARIO
  // ============================================================

  if (!seleccionado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F5F2] px-4 py-8">
        <div className="w-full max-w-md">

          {/* LOGO / MARCA */}
          <div className="mb-8 text-center">
            <div className="mx-auto  flex items-center justify-center ">
            <Image
                src="/Logo.png"
                alt="Logo"
                width={100}
                height={100}
                className=" object-contain "
              />
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-black">
              MrParrilla
            </h1>

            <p className="mt-1 text-sm text-[#8A8577]">
              Sistema de gestión
            </p>
          </div>

          {/* CARD */}
          <div className="rounded-2xl border border-[#E6E3DC] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">

            <div className="mb-5">
              <p className="text-sm font-semibold text-[#22201D]">
                Selecciona tu usuario
              </p>

              <p className="mt-1 text-xs text-[#8A8577]">
                Ingresa con tu cuenta para continuar
              </p>
            </div>

            {usuarios.length > 0 ? (
              <div className="space-y-2">
                {usuarios.map((usuario) => (
                  <button
                    key={usuario.id}
                    type="button"
                    onClick={() => setSeleccionado(usuario)}
                    className="
                      group
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-[#E8E5DE]
                      bg-white
                      p-3
                      text-left
                      transition-all
                      duration-200
                      hover:border-[#22201D]
                      hover:bg-[#FAF9F7]
                      hover:shadow-sm
                      active:scale-[0.99]
                    "
                  >
                    {/* AVATAR */}
                    <div className="
                      flex
                      size-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#22201D]
                      text-sm
                      font-semibold
                      text-white
                    ">
                      {iniciales(usuario.nombre)}
                    </div>

                    {/* INFORMACIÓN */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#22201D]">
                        {usuario.nombre}
                      </p>

                      <span className="
                        mt-1
                        inline-flex
                        rounded-md
                        bg-[#F1F0ED]
                        px-2
                        py-0.5
                        text-[11px]
                        font-medium
                        capitalize
                        text-[#777166]
                      ">
                        {nombreRol(usuario.rol)}
                      </span>
                    </div>

                    {/* FLECHA */}
                    <ChevronRight
                      size={17}
                      className="
                        shrink-0
                        text-[#B7B2A8]
                        transition-transform
                        duration-200
                        group-hover:translate-x-0.5
                        group-hover:text-[#22201D]
                      "
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="
                rounded-xl
                border
                border-dashed
                border-[#DDD9D0]
                bg-[#FAF9F7]
                px-4
                py-8
                text-center
              ">
                <p className="text-sm font-medium text-[#22201D]">
                  No hay usuarios disponibles
                </p>

                <p className="mt-1 text-xs text-[#8A8577]">
                  Créa usuarios activos desde Supabase.
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <p className="mt-5 text-center text-[11px] text-[#AAA49A]">
            Acceso autorizado únicamente para personal
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // INGRESO DE PIN
  // ============================================================

  return (
    <main className="
      flex
      min-h-screen
      items-center
      justify-center
      bg-[#F6F5F2]
      px-4
      py-8
    ">
      <div className="w-full max-w-sm">

        {/* VOLVER */}
        <button
          type="button"
          onClick={cambiarUsuario}
          disabled={cargando}
          className="
            mb-6
            flex
            items-center
            gap-1.5
            text-sm
            font-medium
            text-[#777166]
            transition-colors
            hover:text-[#22201D]
            disabled:pointer-events-none
            disabled:opacity-50
          "
        >
          <ChevronLeft size={17} />

          Cambiar usuario
        </button>

        {/* CARD PRINCIPAL */}
        <div className="
          rounded-2xl
          border
          border-[#E6E3DC]
          bg-white
          p-6
          shadow-[0_8px_30px_rgba(0,0,0,0.05)]
        ">

          {/* USUARIO */}
          <div className="flex flex-col items-center text-center">

            <div className="
              mb-3
              flex
              size-14
              items-center
              justify-center
              rounded-2xl
              bg-[#22201D]
              text-base
              font-semibold
              text-white
            ">
              {iniciales(seleccionado.nombre)}
            </div>

            <p className="text-base font-semibold text-[#22201D]">
              {seleccionado.nombre}
            </p>

            <span className="
              mt-1
              rounded-md
              bg-[#F1F0ED]
              px-2
              py-0.5
              text-[11px]
              font-medium
              text-[#777166]
            ">
              {nombreRol(seleccionado.rol)}
            </span>
          </div>

          {/* PIN */}
          <div className="mt-8">

            <div className="mb-4 flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`
                    size-3
                    rounded-full
                    border
                    transition-all
                    duration-200
                    ${
                      i < pin.length
                        ? "border-[#22201D] bg-[#22201D] scale-110"
                        : "border-[#C9C5BC] bg-transparent"
                    }
                  `}
                />
              ))}
            </div>

            {/* ESTADO */}
            <div className="
              flex
              h-6
              items-center
              justify-center
              gap-1.5
              text-xs
            ">
              {cargando ? (
                <>
                  <Loader2
                    size={13}
                    className="animate-spin text-[#777166]"
                  />

                  <span className="text-[#777166]">
                    Verificando PIN...
                  </span>
                </>
              ) : error ? (
                <span className="font-medium text-[#B33A32]">
                  {error}
                </span>
              ) : (
                <span className="text-[#AAA49A]">
                  Ingresa tu PIN de 4 dígitos
                </span>
              )}
            </div>
          </div>

          {/* TECLADO */}
          <div className="
            mt-7
            grid
            grid-cols-3
            gap-2
          ">
            {TECLAS.map((k, i) =>
              k === "" ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => void tecla(k)}
                  disabled={cargando}
                  className="
                    flex
                    h-14
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-[#E8E5DE]
                    bg-[#FAF9F7]
                    text-lg
                    font-medium
                    tabular-nums
                    text-[#22201D]
                    transition-all
                    duration-150
                    hover:border-[#D2CEC5]
                    hover:bg-[#F3F1EC]
                    active:scale-95
                    active:bg-[#EAE7E0]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {k === "borrar" ? (
                    <Delete size={19} />
                  ) : (
                    k
                  )}
                </button>
              ),
            )}
          </div>

          {/* SEGURIDAD */}
          <div className="
            mt-6
            flex
            items-center
            justify-center
            gap-1.5
            text-[11px]
            text-[#AAA49A]
          ">
            <ShieldCheck size={13} />

            Acceso seguro
          </div>
        </div>

        {/* MARCA */}
        <p className="
          mt-5
          text-center
          text-[11px]
          text-[#AAA49A]
        ">
          MrParrilla · Sistema interno
        </p>
      </div>
    </main>
  );
}
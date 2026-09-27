"use client";

import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Delete,
  Loader2,
  Receipt,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

type Usuario = {
  id: string;
  nombre: string;
  rol: string;
};

type LoginResponse = {
  access_token?: string;
  refresh_token?: string;
  usuario?: Usuario;
  error?: string;
};

const RUTA_POR_ROL: Record<string, string> = {
  admin: "/dashboard",
  cajero: "/dashboard",
  mesero: "/dashboard",
  cocina: "/dashboard",
};

const ROL_LABEL: Record<string, string> = {
  admin: "Administrador",
  cajero: "Cajero",
  mesero: "Mesero",
  cocina: "Cocinero",
};

const ROL_ICON: Record<
  string,
  typeof ShieldCheck
> = {
  admin: ShieldCheck,
  cajero: Receipt,
  mesero: UtensilsCrossed,
  cocina: ChefHat,
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
  null,
  "0",
  "borrar",
] as const;

const LONGITUD_PIN = 4;

function normalizarRol(rol: string) {
  return rol.trim().toLowerCase();
}

function obtenerIconoRol(rol: string) {
  return ROL_ICON[normalizarRol(rol)] ?? UtensilsCrossed;
}

function obtenerNombreRol(rol: string) {
  return ROL_LABEL[normalizarRol(rol)] ?? rol;
}

function obtenerIniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export default function LoginPage() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [seleccionado, setSeleccionado] =
    useState<Usuario | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  /**
   * Carga los usuarios disponibles para iniciar sesión.
   */
  useEffect(() => {
    let cancelado = false;

    const cargarUsuarios = async () => {
      const {
        data,
        error: usuariosError,
      } = await supabase.rpc("usuarios_para_login");

      if (cancelado || usuariosError) {
        return;
      }

      setUsuarios(data ?? []);
    };

    void cargarUsuarios();

    return () => {
      cancelado = true;
    };
  }, []);

  /**
   * Inicia sesión enviando el PIN al endpoint.
   */
  const iniciarSesion = useCallback(
    async (pinIngresado: string) => {
      if (!seleccionado || cargando) {
        return;
      }

      setCargando(true);
      setError("");

      try {
        const response = await fetch("/api/login-pin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuario_id: seleccionado.id,
            pin: pinIngresado,
          }),
        });

        const data =
          (await response.json()) as LoginResponse;

        if (!response.ok) {
          setError(data.error ?? "PIN incorrecto");
          setPin("");
          return;
        }

        const {
          access_token,
          refresh_token,
          usuario,
        } = data;

        if (
          !access_token ||
          !refresh_token ||
          !usuario
        ) {
          setError(
            "La respuesta de autenticación es inválida.",
          );
          setPin("");
          return;
        }

        const { error: sessionError } =
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

        if (sessionError) {
          setError("No se pudo iniciar la sesión.");
          setPin("");
          return;
        }

        const rol = normalizarRol(usuario.rol);

        router.push(
          RUTA_POR_ROL[rol] ?? "/dashboard",
        );
      } catch {
        setError("No se pudo conectar con el servidor.");
        setPin("");
      } finally {
        setCargando(false);
      }
    },
    [cargando, router, seleccionado],
  );

  /**
   * Agrega un dígito al PIN.
   */
  const agregarDigito = useCallback(
    (digito: string) => {
      if (
        cargando ||
        !seleccionado ||
        pin.length >= LONGITUD_PIN
      ) {
        return;
      }

      setError("");

      const nuevoPin = `${pin}${digito}`;

      setPin(nuevoPin);

      if (nuevoPin.length === LONGITUD_PIN) {
        void iniciarSesion(nuevoPin);
      }
    },
    [
      cargando,
      iniciarSesion,
      pin,
      seleccionado,
    ],
  );

  /**
   * Elimina el último dígito del PIN.
   */
  const borrarDigito = useCallback(() => {
    if (cargando) {
      return;
    }

    setError("");
    setPin((actual) => actual.slice(0, -1));
  }, [cargando]);

  /**
   * Maneja las teclas del teclado físico.
   *
   * 0-9       -> agregar dígito
   * Backspace -> borrar
   * Delete    -> borrar
   * Enter     -> validar PIN completo
   */
  const manejarTeclado = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!seleccionado || cargando) {
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        agregarDigito(event.key);
        return;
      }

      if (
        event.key === "Backspace" ||
        event.key === "Delete"
      ) {
        event.preventDefault();
        borrarDigito();
        return;
      }

      if (
        event.key === "Enter" &&
        pin.length === LONGITUD_PIN
      ) {
        event.preventDefault();
        void iniciarSesion(pin);
      }
    },
    [
      agregarDigito,
      borrarDigito,
      cargando,
      iniciarSesion,
      pin,
      seleccionado,
    ],
  );

  /**
   * Cambia nuevamente a la selección de usuario.
   */
  const cambiarUsuario = useCallback(() => {
    if (cargando) {
      return;
    }

    setSeleccionado(null);
    setPin("");
    setError("");
  }, [cargando]);

  /**
   * Selecciona un usuario y prepara el ingreso del PIN.
   */
  const seleccionarUsuario = useCallback(
    (usuario: Usuario) => {
      setSeleccionado(usuario);
      setPin("");
      setError("");
    },
    [],
  );

  return (
    <main className="relative flex min-h-screen flex-col bg-[#6E1B18] lg:flex-row  max-h-100">
      {/* Textura de brasas sobre todo el fondo rojo */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
        style={{
          background:
            "radial-gradient(55% 45% at 18% 12%, rgba(255,148,88,0.28) 0%, transparent 60%), radial-gradient(50% 45% at 95% 100%, rgba(0,0,0,0.45) 0%, transparent 65%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 14px)",
        }}
      />

      {/* Panel izquierdo — identidad de marca */}
      <div className="relative z-10 flex shrink-0 items-center justify-center px-8 py-14 lg:w-[44%] lg:py-0">
        <div className="flex w-full max-w-sm flex-col items-center text-center lg:items-start lg:text-left">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 scale-125 rounded-full bg-white/10 blur-2xl" />

            <Image
              src="/Logo.png"
              alt="Logo MrParrilla"
              width={280}
              height={280}
              className="relative object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.35)]"
              loading="eager"
            />
          </div>

          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            MrParrilla
          </h1>

          <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-[#F3D9CE]">
            Bienvenido de vuelta. Elige tu usuario e
            ingresa tu PIN para abrir el turno y empezar
            a atender.
          </p>

          <div className="mt-10 hidden items-center gap-2 text-xs text-[#E7B7A8] lg:flex">
            <ShieldCheck size={14} />
            Acceso exclusivo para personal autorizado
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="relative z-10 mt-2 flex flex-1 items-center justify-center rounded-t-[2.25rem] bg-[#FBFAF8] px-4 py-12 shadow-[0_-16px_40px_rgba(0,0,0,0.18)] sm:px-8 lg:mt-0 lg:rounded-t-none lg:rounded-l-[2.75rem] lg:py-10 lg:shadow-[-24px_0_48px_rgba(0,0,0,0.18)]">
        {!seleccionado ? (
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-3 h-1 w-10 rounded-full bg-[#7A1F1B]" />

              <p className="text-2xl font-bold text-[#22201D]">
                Selecciona tu usuario
              </p>

              <p className="mt-1.5 text-sm text-[#8A8577]">
                Elige tu perfil para comenzar tu turno
              </p>
            </div>

            {usuarios.length > 0 ? (
              <div className="space-y-2.5">
                {usuarios.map((usuario) => {
                  const IconoRol = obtenerIconoRol(
                    usuario.rol,
                  );

                  return (
                    <button
                      key={usuario.id}
                      type="button"
                      onClick={() =>
                        seleccionarUsuario(usuario)
                      }
                      className="group relative flex w-full cursor-pointer items-center gap-3.5 overflow-hidden rounded-2xl border border-[#E8E5DE] bg-white p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_10px_24px_rgba(122,31,27,0.14)] active:translate-y-0 active:scale-[0.99]"
                    >
                      <span className="absolute inset-y-0 left-0 w-1 scale-y-0 bg-[#7A1F1B] transition-transform duration-200 group-hover:scale-y-100" />

                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B2A27] to-[#161514] text-sm font-semibold text-white">
                        {obtenerIniciales(
                          usuario.nombre,
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-[#22201D]">
                          {usuario.nombre}
                        </p>

                        <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-[#F1F0ED] px-2 py-0.5 text-[11px] font-medium text-[#777166]">
                          <IconoRol size={11} />
                          {obtenerNombreRol(
                            usuario.rol,
                          )}
                        </span>
                      </div>

                      <ChevronRight
                        size={18}
                        className="shrink-0 text-[#C9C5BC] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#7A1F1B]"
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#DDD9D0] bg-white px-4 py-8 text-center">
                <p className="text-sm font-medium text-[#22201D]">
                  No hay usuarios disponibles
                </p>

                <p className="mt-1 text-xs text-[#8A8577]">
                  Crea usuarios activos desde Supabase.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-full max-w-sm outline-none"
            tabIndex={0}
            onKeyDown={manejarTeclado}
          >
            {/* Cambiar usuario */}
            <button
              type="button"
              onClick={cambiarUsuario}
              disabled={cargando}
              className="mb-6 flex items-center gap-1.5 text-sm font-medium text-[#777166] transition-colors hover:text-[#22201D] disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronLeft size={17} />
              Cambiar usuario
            </button>

            {/* Usuario seleccionado */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#22201D] text-base font-semibold text-white">
                {obtenerIniciales(
                  seleccionado.nombre,
                )}
              </div>

              <p className="text-base font-semibold text-[#22201D]">
                {seleccionado.nombre}
              </p>

              <span className="mt-1 rounded-md bg-[#F1F0ED] px-2 py-0.5 text-[11px] font-medium text-[#777166]">
                {obtenerNombreRol(seleccionado.rol)}
              </span>
            </div>

            {/* Indicador del PIN */}
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-center gap-3">
                {Array.from(
                  { length: LONGITUD_PIN },
                  (_, indice) => (
                    <div
                      key={indice}
                      className={`size-3 rounded-full border transition-all duration-200 ${
                        indice < pin.length
                          ? "scale-110 border-[#7A1F1B] bg-[#7A1F1B]"
                          : "border-[#C9C5BC] bg-transparent"
                      }`}
                    />
                  ),
                )}
              </div>

              <div className="flex h-6 items-center justify-center gap-1.5 text-xs">
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
                    Usa el teclado o ingresa tu PIN
                  </span>
                )}
              </div>
            </div>

            {/* Teclado numérico */}
            <div className="mt-7 grid grid-cols-3 gap-2">
              {TECLAS.map((teclaActual, indice) =>
                teclaActual === null ? (
                  <div key={indice} />
                ) : (
                  <button
                    key={indice}
                    type="button"
                    onClick={() => {
                      if (teclaActual === "borrar") {
                        borrarDigito();
                        return;
                      }

                      agregarDigito(teclaActual);
                    }}
                    disabled={cargando}
                    className="flex h-14 items-center justify-center rounded-xl border border-[#E8E5DE] bg-[#FAF9F7] text-lg font-medium tabular-nums text-[#22201D] transition-all duration-150 hover:border-[#D2CEC5] hover:bg-[#F3F1EC] active:scale-95 active:bg-[#EAE7E0] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {teclaActual === "borrar" ? (
                      <Delete size={19} />
                    ) : (
                      teclaActual
                    )}
                  </button>
                ),
              )}
            </div>

            {/* Indicador de teclado físico */}
            <div className="mt-5 hidden items-center justify-center gap-1.5 text-[11px] text-[#AAA49A] sm:flex">
              <span>También puedes usar el teclado numérico o las teclas 0–9</span>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#AAA49A] lg:hidden">
              <ShieldCheck size={13} />
              Acceso seguro
            </div>

            <p className="mt-5 text-center text-[11px] text-[#AAA49A]">
              MrParrilla · Sistema interno
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
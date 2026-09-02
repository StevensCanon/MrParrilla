"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  Utensils,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { createAuthedClient } from "@/lib/supabaseClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Plato = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  disponible: boolean;
  creado_en: string;
};

type FormularioPlato = {
  nombre: string;
  categoria: string;
  precio: string;
  disponible: boolean;
};

const categorias = ["desayuno", "almuerzo", "bebida", "adicional", "combos"];

const formularioInicial: FormularioPlato = {
  nombre: "",
  categoria: "",
  precio: "",
  disponible: true,
};

const PLATOS_POR_PAGINA = 15;

const money = (valor: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(valor) || 0));

const categoriaLabel = (categoria: string) =>
  categoria
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());

const categoriaDotClass = (categoria: string) => {
  switch (categoria) {
    case "desayuno":
      return "bg-amber-500";

    case "almuerzo":
      return "bg-blue-500";

    case "bebida":
      return "bg-green-500";

    case "adicional":
      return "bg-violet-500";

    case "combos":
      return "bg-red-500";


    default:
      return "bg-[#B6B1A2]";
  }
};

export default function PlatosPage() {
  const router = useRouter();

  const [platos, setPlatos] = useState<Plato[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [pagina, setPagina] = useState(1);

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [platoEditando, setPlatoEditando] = useState<Plato | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioPlato>(formularioInicial);

  /* ============================================================
     AUTENTICACIÓN
     ============================================================ */

  const obtenerToken = useCallback(() => {
    const sesionGuardada = sessionStorage.getItem("sesion");

    if (!sesionGuardada) {
      return null;
    }

    try {
      const sesion: { token?: string } = JSON.parse(sesionGuardada);

      if (!sesion?.token) {
        sessionStorage.removeItem("sesion");
        return null;
      }

      return sesion.token;
    } catch {
      sessionStorage.removeItem("sesion");
      return null;
    }
  }, []);

  /* ============================================================
     CARGAR PLATOS
     ============================================================ */

  const cargarPlatos = useCallback(async () => {
    const token = obtenerToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const supabase = createAuthedClient(token);

      const { data, error: errorSupabase } = await supabase
        .from("platos")
        .select("id, nombre, categoria, precio, disponible, creado_en")
        .order("nombre", { ascending: true });

      if (errorSupabase) {
        console.error("Error cargando platos:", errorSupabase);
        setError(errorSupabase.message);
        return;
      }

      setPlatos((data as Plato[]) ?? []);
      setError(null);
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("No se pudo cargar la información de los platos.");
    } finally {
      setLoading(false);
    }
  }, [obtenerToken, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarPlatos();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [cargarPlatos]);

  /* ============================================================
     FILTROS
     ============================================================ */

  const platosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return platos.filter((plato) => {
      const coincideBusqueda = plato.nombre
        .toLowerCase()
        .includes(texto);

      const coincideCategoria =
        filtroCategoria === "todas" ||
        plato.categoria === filtroCategoria;

      return coincideBusqueda && coincideCategoria;
    });
  }, [platos, busqueda, filtroCategoria]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroCategoria]);

  /* ============================================================
     PAGINACIÓN
     ============================================================ */

  const totalPaginas = Math.max(
    1,
    Math.ceil(platosFiltrados.length / PLATOS_POR_PAGINA),
  );

  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  const platosPagina = useMemo(() => {
    const inicio = (pagina - 1) * PLATOS_POR_PAGINA;

    return platosFiltrados.slice(
      inicio,
      inicio + PLATOS_POR_PAGINA,
    );
  }, [platosFiltrados, pagina]);

  const rangoInicio =
    platosFiltrados.length === 0
      ? 0
      : (pagina - 1) * PLATOS_POR_PAGINA + 1;

  const rangoFin = Math.min(
    pagina * PLATOS_POR_PAGINA,
    platosFiltrados.length,
  );

  /* ============================================================
     FORMULARIO
     ============================================================ */

  const abrirCrear = () => {
    setPlatoEditando(null);
    setFormulario({ ...formularioInicial });
    setError(null);
    setDialogoAbierto(true);
  };

  const abrirEditar = (plato: Plato) => {
    setPlatoEditando(plato);

    setFormulario({
      nombre: plato.nombre,
      categoria: plato.categoria,
      precio: String(plato.precio),
      disponible: plato.disponible,
    });

    setError(null);
    setDialogoAbierto(true);
  };

  /* ============================================================
     GUARDAR
     ============================================================ */

  const guardarPlato = async () => {
    setError(null);

    if (!formulario.nombre.trim()) {
      setError("El nombre del plato es obligatorio.");
      return;
    }

    if (!formulario.categoria) {
      setError("Selecciona una categoría.");
      return;
    }

    const precio = Number(formulario.precio);

    if (
      formulario.precio.trim() === "" ||
      Number.isNaN(precio) ||
      precio < 0
    ) {
      setError("El precio no es válido.");
      return;
    }

    const token = obtenerToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setGuardando(true);

    try {
      const supabase = createAuthedClient(token);

      const datos = {
        nombre: formulario.nombre.trim(),
        categoria: formulario.categoria,
        precio,
        disponible: formulario.disponible,
      };

      if (platoEditando) {
        const { error: errorUpdate } = await supabase
          .from("platos")
          .update(datos)
          .eq("id", platoEditando.id);

        if (errorUpdate) {
          console.error("Error actualizando plato:", errorUpdate);
          setError(errorUpdate.message);
          return;
        }
      } else {
        const { error: errorInsert } = await supabase
          .from("platos")
          .insert(datos);

        if (errorInsert) {
          console.error("Error creando plato:", errorInsert);
          setError(errorInsert.message);
          return;
        }
      }

      setDialogoAbierto(false);
      setFormulario({ ...formularioInicial });
      setPlatoEditando(null);

      await cargarPlatos();
    } catch (err) {
      console.error("Error guardando plato:", err);
      setError("Ocurrió un error al guardar el plato.");
    } finally {
      setGuardando(false);
    }
  };

  /* ============================================================
     DISPONIBILIDAD
     ============================================================ */

  const cambiarDisponibilidad = async (plato: Plato) => {
    const token = obtenerToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const supabase = createAuthedClient(token);
      const nuevaDisponibilidad = !plato.disponible;

      const { error: errorUpdate } = await supabase
        .from("platos")
        .update({
          disponible: nuevaDisponibilidad,
        })
        .eq("id", plato.id);

      if (errorUpdate) {
        console.error(
          "Error cambiando disponibilidad:",
          errorUpdate,
        );

        setError(errorUpdate.message);
        return;
      }

      setPlatos((actuales) =>
        actuales.map((actual) =>
          actual.id === plato.id
            ? {
                ...actual,
                disponible: nuevaDisponibilidad,
              }
            : actual,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar la disponibilidad.");
    }
  };

  /* ============================================================
     ELIMINAR
     ============================================================ */

  const eliminarPlato = async (plato: Plato) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${plato.nombre}"?`,
    );

    if (!confirmar) return;

    const token = obtenerToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const supabase = createAuthedClient(token);

      const { error: errorDelete } = await supabase
        .from("platos")
        .delete()
        .eq("id", plato.id);

      if (errorDelete) {
        console.error("Error eliminando plato:", errorDelete);
        setError(errorDelete.message);
        return;
      }

      setPlatos((actuales) =>
        actuales.filter((actual) => actual.id !== plato.id),
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el plato.");
    }
  };

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6F3]">
        <div className="text-sm text-[#8A8577]">
          Cargando platos…
        </div>
      </main>
    );
  }

  const guardarDeshabilitado =
    guardando ||
    !formulario.nombre.trim() ||
    !formulario.categoria;

  /* ============================================================
     UI
     ============================================================ */

  return (
    <main className="min-h-screen bg-[#F7F6F3]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* ENCABEZADO */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-[#211F1B] sm:text-[28px]">
              Platos
            </h1>

            <p className="mt-1 text-sm text-[#8A8577]">
              Administra el menú y la disponibilidad de tus platos.
            </p>
          </div>

          <Button
            type="button"
            onClick={abrirCrear}
            className="w-fit gap-1.5 rounded-full bg-black px-4 text-white shadow-none hover:bg-[#211F1B]/90 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nuevo plato
          </Button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="flex items-center justify-between rounded-[10px] bg-[#FBEAE8] px-4 py-3 text-sm text-[#C6433C]">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-3 shrink-0 text-xs font-medium underline underline-offset-2"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* BUSCADOR + FILTROS */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-[10px] border border-[#E7E4DC] bg-white px-3 py-2 sm:w-72">
            <Search
              size={16}
              className="shrink-0 text-[#8A8577]"
            />

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar plato"
              className="w-full bg-transparent text-sm text-[#211F1B] outline-none placeholder:text-[#B6B1A2]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {["todas", ...categorias].map((categoria) => {
              const activo = filtroCategoria === categoria;

              return (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => setFiltroCategoria(categoria)}
                  className={`
                    shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5
                    text-[13px] font-medium transition-colors
                    ${
                      activo
                        ? "border-[#211F1B] bg-[#211F1B] text-white"
                        : "border-[#E7E4DC] bg-transparent text-[#8A8577] hover:bg-[#EFEDE6]"
                    }
                  `}
                >
                  {categoria === "todas"
                    ? "Todas"
                    : categoriaLabel(categoria)}
                </button>
              );
            })}
          </div>
        </div>

        {/* TABLA */}

        <div className="overflow-hidden rounded-[14px] border border-[#E7E4DC] bg-white">

          {/* HEADER */}

          <div className="hidden items-center gap-4 border-b border-[#E7E4DC] px-5 py-3 text-[13px] text-[#8A8577] sm:flex">
            <span className="w-2 shrink-0" />

            <span className="flex-1">
              Plato
            </span>

            <span className="w-28 shrink-0">
              Categoría
            </span>

            <span className="w-24 shrink-0 text-right">
              Precio
            </span>

            <span className="w-16 shrink-0 text-center">
              Estado
            </span>

            <span className="w-8 shrink-0" />
          </div>

          {/* SIN RESULTADOS */}

          {platosPagina.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <Utensils
                size={26}
                className="text-[#B6B1A2]"
              />

              <p className="text-sm font-medium text-[#211F1B]">
                No hay platos
              </p>

              <p className="text-[13px] text-[#8A8577]">
                {busqueda || filtroCategoria !== "todas"
                  ? "No encontramos platos con esos filtros."
                  : "Comienza agregando tu primer plato."}
              </p>
            </div>
          ) : (
            platosPagina.map((plato) => (
              <div
                key={plato.id}
                className="flex items-center gap-3 border-b border-[#E7E4DC] px-4 py-3 last:border-0 hover:bg-black/[0.015] sm:gap-4 sm:px-5"
              >

                {/* CATEGORÍA */}

                <span
                  className={`
                    hidden size-2 shrink-0 rounded-full sm:block
                    ${categoriaDotClass(plato.categoria)}
                  `}
                />

                {/* NOMBRE */}

                <button
                  type="button"
                  onClick={() => abrirEditar(plato)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-[15px] font-medium text-[#211F1B]">
                    {plato.nombre}
                  </span>

                  <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#8A8577] sm:hidden">
                    <span>
                      {categoriaLabel(plato.categoria)}
                    </span>

                    <span>·</span>

                    <span className="tabular-nums">
                      {money(plato.precio)}
                    </span>
                  </span>
                </button>

                {/* CATEGORÍA DESKTOP */}

                <span className="hidden w-28 shrink-0 truncate text-sm text-[#8A8577] sm:block">
                  {categoriaLabel(plato.categoria)}
                </span>

                {/* PRECIO DESKTOP */}

                <span className="hidden w-24 shrink-0 text-right text-sm tabular-nums text-[#8A8577] sm:block">
                  {money(plato.precio)}
                </span>

                {/* DISPONIBILIDAD */}

                <div className="flex w-16 shrink-0 justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      cambiarDisponibilidad(plato)
                    }
                    aria-pressed={plato.disponible}
                    aria-label={
                      plato.disponible
                        ? "Marcar no disponible"
                        : "Marcar disponible"
                    }
                    className={`
                      relative h-6 w-11 shrink-0 rounded-full
                      transition-colors
                      ${
                        plato.disponible
                          ? "bg-[#2FA36B]"
                          : "bg-[#D8D4C8]"
                      }
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 size-4 rounded-full bg-white
                        shadow transition-all
                        ${
                          plato.disponible
                            ? "left-[22px]"
                            : "left-1"
                        }
                      `}
                    />
                  </button>
                </div>

                {/* ACCIONES */}

                <div className="w-8 shrink-0 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Acciones para ${plato.nombre}`}
                      className="inline-flex size-8 items-center justify-center rounded-full text-[#8A8577] transition hover:bg-black/[0.04] focus:outline-none"
                    >
                      <MoreHorizontal size={17} />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-[12px]"
                    >
                      <DropdownMenuItem
                        onClick={() => abrirEditar(plato)}
                      >
                        <Pencil size={15} />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() =>
                          cambiarDisponibilidad(plato)
                        }
                      >
                        <Power size={15} />

                        {plato.disponible
                          ? "Desactivar"
                          : "Activar"}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => eliminarPlato(plato)}
                        variant="destructive"
                      >
                        <Trash2 size={15} />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINACIÓN */}

        <div className="flex flex-col items-center justify-between gap-3 px-1 sm:flex-row">
          <p className="text-[13px] text-[#8A8577]">
            {platosFiltrados.length === 0
              ? "Sin resultados"
              : `Mostrando ${rangoInicio}–${rangoFin} de ${platosFiltrados.length} platos`}
          </p>

          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPagina((actual) =>
                    Math.max(1, actual - 1),
                  )
                }
                disabled={pagina === 1}
                className="inline-flex size-8 items-center justify-center rounded-full border border-[#E7E4DC] text-[#211F1B] transition hover:bg-[#EFEDE6] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-1 text-[13px] text-[#8A8577]">
                Página {pagina} de {totalPaginas}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPagina((actual) =>
                    Math.min(totalPaginas, actual + 1),
                  )
                }
                disabled={pagina === totalPaginas}
                className="inline-flex size-8 items-center justify-center rounded-full border border-[#E7E4DC] text-[#211F1B] transition hover:bg-[#EFEDE6] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          DIALOG
          ======================================================== */}

      <Dialog
        open={dialogoAbierto}
        onOpenChange={setDialogoAbierto}
      >
        <DialogContent className="gap-0 overflow-hidden rounded-[16px] bg-white p-0 sm:max-w-[460px]">

          <DialogHeader className="px-6 pb-3 pt-6">
            <DialogTitle className="text-[18px] font-semibold text-[#211F1B]">
              {platoEditando
                ? "Editar plato"
                : "Nuevo plato"}
            </DialogTitle>

            <DialogDescription className="text-sm text-[#8A8577]">
              {platoEditando
                ? "Modifica la información del plato."
                : "Agrega un nuevo plato al menú."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-6 py-2">

            {/* ERROR */}

            {error && (
              <div className="rounded-[10px] bg-[#FBEAE8] px-3.5 py-2.5 text-[13px] text-[#C6433C]">
                {error}
              </div>
            )}

            {/* CAMPOS */}

            <div className="overflow-hidden rounded-[12px] border border-[#E7E4DC]">

              {/* NOMBRE */}

              <div className="flex items-center justify-between gap-3 border-b border-[#E7E4DC] px-4 py-3">
                <label
                  htmlFor="nombre"
                  className="shrink-0 text-sm text-[#8A8577]"
                >
                  Nombre
                </label>

                <Input
                  id="nombre"
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      nombre: e.target.value,
                    }))
                  }
                  placeholder="Ej. Hamburguesa clásica"
                  className="h-auto border-none bg-transparent p-0 text-right text-[15px] text-[#211F1B] shadow-none focus-visible:ring-0"
                />
              </div>

              {/* CATEGORÍA */}

              <div className="flex items-center justify-between gap-3 border-b border-[#E7E4DC] px-4 py-3">
                <span className="shrink-0 text-sm text-[#8A8577]">
                  Categoría
                </span>

                <Select
                  value={formulario.categoria}
                  onValueChange={(value) =>
                    setFormulario((actual) => ({
                      ...actual,
                      categoria: value ?? "",
                    }))
                  }
                >
                  <SelectTrigger className="h-auto w-auto border-none bg-transparent p-0 text-[15px] shadow-none focus:ring-0">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>

                  <SelectContent align="end">
                    {categorias.map((categoria) => (
                      <SelectItem
                        key={categoria}
                        value={categoria}
                      >
                        {categoriaLabel(categoria)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PRECIO */}

              <div className="flex items-center justify-between gap-3 border-b border-[#E7E4DC] px-4 py-3">
                <label
                  htmlFor="precio"
                  className="shrink-0 text-sm text-[#8A8577]"
                >
                  Precio
                </label>

                <Input
                  id="precio"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={formulario.precio}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      precio: e.target.value,
                    }))
                  }
                  placeholder="25000"
                  className="h-auto border-none bg-transparent p-0 text-right text-[15px] tabular-nums text-[#211F1B] shadow-none focus-visible:ring-0"
                />
              </div>

              {/* DISPONIBILIDAD */}

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm text-[#8A8577]">
                  Disponible
                </span>

                <button
                  type="button"
                  aria-label="Cambiar disponibilidad"
                  aria-pressed={formulario.disponible}
                  onClick={() =>
                    setFormulario((actual) => ({
                      ...actual,
                      disponible: !actual.disponible,
                    }))
                  }
                  className={`
                    relative h-6 w-11 shrink-0 rounded-full
                    transition-colors
                    ${
                      formulario.disponible
                        ? "bg-[#2FA36B]"
                        : "bg-[#D8D4C8]"
                    }
                  `}
                >
                  <span
                    className={`
                      absolute top-1 size-4 rounded-full bg-white
                      shadow transition-all
                      ${
                        formulario.disponible
                          ? "left-[22px]"
                          : "left-1"
                      }
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <DialogFooter className="flex items-center gap-2 px-6 pb-6 pt-4">
            {platoEditando && (
              <button
                type="button"
                onClick={() => {
                  setDialogoAbierto(false);
                  eliminarPlato(platoEditando);
                }}
                className="mr-auto text-[13px] font-medium text-[#C6433C] hover:underline"
              >
                Eliminar plato
              </button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogoAbierto(false)}
              disabled={guardando}
              className="rounded-full border-[#E7E4DC] text-[#211F1B] shadow-none hover:bg-[#EFEDE6]"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={guardarPlato}
              disabled={guardarDeshabilitado}
              className="rounded-full bg-[#211F1B] text-white shadow-none hover:bg-[#211F1B]/90"
            >
              {guardando
                ? "Guardando..."
                : platoEditando
                  ? "Guardar cambios"
                  : "Crear plato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  Utensils,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

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

const categorias = [
  "desayuno",
  "almuerzo",
  "bebida",
  "adicional",
  "combos",
];

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

const obtenerPlatos = async (): Promise<Plato[]> => {
  const { data, error } = await supabase
    .from("platos")
    .select("id, nombre, categoria, precio, disponible, creado_en")
    .order("nombre", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as Plato[]) ?? [];
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

  useEffect(() => {
    let cancelado = false;

    const inicializar = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const platosCargados = await obtenerPlatos();

        if (cancelado) return;

        setPlatos(platosCargados);
        setError(null);
      } catch (err) {
        if (cancelado) return;

        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la información de los platos.",
        );
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    };

    void inicializar();

    return () => {
      cancelado = true;
    };
  }, [router]);

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

  const totalPaginas = Math.max(
    1,
    Math.ceil(platosFiltrados.length / PLATOS_POR_PAGINA),
  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const platosPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * PLATOS_POR_PAGINA;

    return platosFiltrados.slice(
      inicio,
      inicio + PLATOS_POR_PAGINA,
    );
  }, [platosFiltrados, paginaActual]);

  const rangoInicio =
    platosFiltrados.length === 0
      ? 0
      : (paginaActual - 1) * PLATOS_POR_PAGINA + 1;

  const rangoFin = Math.min(
    paginaActual * PLATOS_POR_PAGINA,
    platosFiltrados.length,
  );

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setGuardando(true);

    try {
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
          setError(errorUpdate.message);
          return;
        }
      } else {
        const { error: errorInsert } = await supabase
          .from("platos")
          .insert(datos);

        if (errorInsert) {
          setError(errorInsert.message);
          return;
        }
      }

      try {
        const platosActualizados = await obtenerPlatos();
        setPlatos(platosActualizados);
      } catch {
        setError(
          "El plato se guardó correctamente, pero no se pudo actualizar la lista.",
        );
      }

      setDialogoAbierto(false);
      setFormulario({ ...formularioInicial });
      setPlatoEditando(null);
    } catch {
      setError("Ocurrió un error al guardar el plato.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarDisponibilidad = async (plato: Plato) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const nuevaDisponibilidad = !plato.disponible;

      const { error: errorUpdate } = await supabase
        .from("platos")
        .update({
          disponible: nuevaDisponibilidad,
        })
        .eq("id", plato.id);

      if (errorUpdate) {
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
    } catch {
      setError("No se pudo cambiar la disponibilidad.");
    }
  };

  const eliminarPlato = async (plato: Plato) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${plato.nombre}"?`,
    );

    if (!confirmar) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const { error: errorDelete } = await supabase
        .from("platos")
        .delete()
        .eq("id", plato.id);

      if (errorDelete) {
        setError(errorDelete.message);
        return;
      }

      setPlatos((actuales) =>
        actuales.filter((actual) => actual.id !== plato.id),
      );
    } catch {
      setError("No se pudo eliminar el plato.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-4 border-b border-[#E5E1D8] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EEE7]">
              <Utensils className="h-5 w-5 text-[#5F5A4F]" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-[#292722]">
                Platos
              </h1>

              <p className="text-sm text-[#8A857A]">
                Gestiona los platos y productos de tu restaurante
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={abrirCrear}
          className="gap-2 rounded-xl bg-[#292722] px-4 text-white hover:bg-[#403C35]"
        >
          <Plus className="h-4 w-4" />
          Nuevo plato
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 py-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A958A]" />

            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar plato..."
              className="h-10 rounded-xl border-[#DDD8CE] bg-white pl-9 text-sm focus-visible:ring-[#B6B1A2]"
            />
          </div>

          <Select
            value={filtroCategoria}
            onValueChange={(value) => {
              if (value === null) return;

              setFiltroCategoria(value);
              setPagina(1);
            }}
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-[#DDD8CE] bg-white lg:w-48">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="todas">
                Todas las categorías
              </SelectItem>

              {categorias.map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {categoriaLabel(categoria)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#E5E1D8] bg-white">
          {loading ? (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#DDD8CE] border-t-[#292722]" />

                <p className="text-sm text-[#8A857A]">
                  Cargando platos...
                </p>
              </div>
            </div>
          ) : platosPagina.length === 0 ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EEE7]">
                <Utensils className="h-6 w-6 text-[#8A857A]" />
              </div>

              <h3 className="text-base font-semibold text-[#292722]">
                No hay platos
              </h3>

              <p className="mt-1 max-w-sm text-sm text-[#8A857A]">
                {busqueda || filtroCategoria !== "todas"
                  ? "No encontramos platos que coincidan con los filtros seleccionados."
                  : "Todavía no has registrado ningún plato."}
              </p>

              {!busqueda && filtroCategoria === "todas" && (
                <Button
                  type="button"
                  onClick={abrirCrear}
                  className="mt-5 gap-2 rounded-xl bg-[#292722] text-white hover:bg-[#403C35]"
                >
                  <Plus className="h-4 w-4" />
                  Crear primer plato
                </Button>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E1D8] bg-[#FAF9F6]">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8A857A]">
                        Plato
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8A857A]">
                        Categoría
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8A857A]">
                        Precio
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8A857A]">
                        Estado
                      </th>

                      <th className="w-16 px-5 py-3" />
                    </tr>
                  </thead>

                  <tbody>
                    {platosPagina.map((plato) => (
                      <tr
                        key={plato.id}
                        className="border-b border-[#F0EDE7] last:border-0 hover:bg-[#FCFBF9]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-[#292722]">
                            {plato.nombre}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${categoriaDotClass(
                                plato.categoria,
                              )}`}
                            />

                            <span className="text-sm text-[#625E55]">
                              {categoriaLabel(plato.categoria)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-[#292722]">
                            {money(plato.precio)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              void cambiarDisponibilidad(plato)
                            }
                            className="inline-flex items-center gap-2"
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                plato.disponible
                                  ? "bg-green-500"
                                  : "bg-[#B6B1A2]"
                              }`}
                            />

                            <span
                              className={`text-sm ${
                                plato.disponible
                                  ? "text-green-700"
                                  : "text-[#8A857A]"
                              }`}
                            >
                              {plato.disponible
                                ? "Disponible"
                                : "No disponible"}
                            </span>
                          </button>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-[#7C776D] hover:bg-[#F1EEE7] hover:text-[#292722]"
                                />
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-44 rounded-xl"
                            >
                              <DropdownMenuItem
                                onClick={() => abrirEditar(plato)}
                                className="gap-2 rounded-lg"
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  void cambiarDisponibilidad(plato)
                                }
                                className="gap-2 rounded-lg"
                              >
                                <Power className="h-4 w-4" />
                                {plato.disponible
                                  ? "Desactivar"
                                  : "Activar"}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  void eliminarPlato(plato)
                                }
                                className="gap-2 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#E5E1D8] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#8A857A]">
                  Mostrando{" "}
                  <span className="font-medium text-[#625E55]">
                    {rangoInicio}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium text-[#625E55]">
                    {rangoFin}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-[#625E55]">
                    {platosFiltrados.length}
                  </span>{" "}
                  platos
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setPagina((actual) => Math.max(1, actual - 1))
                    }
                    disabled={paginaActual <= 1}
                    className="h-8 w-8 rounded-lg border-[#DDD8CE]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="min-w-20 text-center text-sm text-[#625E55]">
                    Página {paginaActual} de {totalPaginas}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setPagina((actual) =>
                        Math.min(totalPaginas, actual + 1),
                      )
                    }
                    disabled={paginaActual >= totalPaginas}
                    className="h-8 w-8 rounded-lg border-[#DDD8CE]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={dialogoAbierto}
        onOpenChange={(abierto) => {
          if (!guardando) {
            setDialogoAbierto(abierto);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#292722]">
              {platoEditando ? "Editar plato" : "Nuevo plato"}
            </DialogTitle>

            <DialogDescription className="text-[#8A857A]">
              {platoEditando
                ? "Modifica la información del plato."
                : "Registra un nuevo plato para tu restaurante."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label
                htmlFor="nombre"
                className="text-sm font-medium text-[#4A463F]"
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
                placeholder="Ej. Hamburguesa especial"
                disabled={guardando}
                className="rounded-xl border-[#DDD8CE]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="categoria"
                  className="text-sm font-medium text-[#4A463F]"
                >
                  Categoría
                </label>

                <Select
                  value={formulario.categoria}
                  onValueChange={(value) => {
                    if (value === null) return;

                    setFormulario((actual) => ({
                      ...actual,
                      categoria: value,
                    }));
                  }}
                  disabled={guardando}
                >
                  <SelectTrigger
                    id="categoria"
                    className="w-full rounded-xl border-[#DDD8CE]"
                  >
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>

                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoriaLabel(categoria)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="precio"
                  className="text-sm font-medium text-[#4A463F]"
                >
                  Precio
                </label>

                <Input
                  id="precio"
                  type="number"
                  min="0"
                  value={formulario.precio}
                  onChange={(e) =>
                    setFormulario((actual) => ({
                      ...actual,
                      precio: e.target.value,
                    }))
                  }
                  placeholder="0"
                  disabled={guardando}
                  className="rounded-xl border-[#DDD8CE]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#E5E1D8] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#292722]">
                  Disponible
                </p>

                <p className="text-xs text-[#8A857A]">
                  Define si el plato puede ser vendido.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={formulario.disponible}
                disabled={guardando}
                onClick={() =>
                  setFormulario((actual) => ({
                    ...actual,
                    disponible: !actual.disponible,
                  }))
                }
                className={`relative h-6 w-11 rounded-full transition ${
                  formulario.disponible
                    ? "bg-[#292722]"
                    : "bg-[#D3CFC6]"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    formulario.disponible
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogoAbierto(false)}
              disabled={guardando}
              className="rounded-xl border-[#DDD8CE]"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={() => void guardarPlato()}
              disabled={guardando}
              className="rounded-xl bg-[#292722] text-white hover:bg-[#403C35]"
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
    </div>
  );
}
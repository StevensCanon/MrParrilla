
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

const categorias = [
    "desayuno",
    "almuerzo",
    "bebida",
    "adicional",
  ];

const formularioInicial: FormularioPlato = {
  nombre: "",
  categoria: "",
  precio: "",
  disponible: true,
};

const money = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(n) || 0));

const categoriaLabel = (categoria: string) => {
  return categoria
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
};

export default function PlatosPage() {
  const router = useRouter();

  const [platos, setPlatos] = useState<Plato[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [platoEditando, setPlatoEditando] = useState<Plato | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioPlato>(formularioInicial);

  /**
   * ============================================================
   * OBTENER TOKEN
   * ============================================================
   */
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

  /**
   * ============================================================
   * CARGAR PLATOS
   * ============================================================
   */
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
        .select(
          "id, nombre, categoria, precio, disponible, creado_en",
        )
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

  /**
   * ============================================================
   * CARGA INICIAL
   *
   * Se ejecuta solamente después de que el componente está
   * montado en el navegador.
   * ============================================================
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarPlatos();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cargarPlatos]);

  /**
   * ============================================================
   * FILTRAR PLATOS
   * ============================================================
   */
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

  /**
   * ============================================================
   * ABRIR CREAR
   * ============================================================
   */
  const abrirCrear = () => {
    setPlatoEditando(null);
    setFormulario({ ...formularioInicial });
    setError(null);
    setDialogoAbierto(true);
  };

  /**
   * ============================================================
   * ABRIR EDITAR
   * ============================================================
   */
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

  /**
   * ============================================================
   * GUARDAR PLATO
   * ============================================================
   */
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

      /**
       * EDITAR
       */
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
      }

      /**
       * CREAR
       */
      else {
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

  /**
   * ============================================================
   * CAMBIAR DISPONIBILIDAD
   * ============================================================
   */
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
        actuales.map((p) =>
          p.id === plato.id
            ? {
                ...p,
                disponible: nuevaDisponibilidad,
              }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar la disponibilidad.");
    }
  };

  /**
   * ============================================================
   * ELIMINAR PLATO
   * ============================================================
   */
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
        actuales.filter((p) => p.id !== plato.id),
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el plato.");
    }
  };

  /**
   * ============================================================
   * LOADING
   * ============================================================
   */
  if (loading) {
    return (
      <main className="p-6">
        <div className="text-sm font-mono text-[#8A8375]">
          Cargando platos…
        </div>
      </main>
    );
  }

  /**
   * ============================================================
   * UI
   * ============================================================
   */
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[#22201D]">
            Platos
          </h1>

          <p className="mt-1 text-sm text-[#8A8375]">
            Administra el menú y la disponibilidad de tus platos.
          </p>
        </div>

        <Button
          type="button"
          onClick={abrirCrear}
          className="bg-[#22201D] text-white hover:bg-[#3A3732]"
        >
          <Plus size={16} />
          Nuevo plato
        </Button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between border border-[#E7B8AD] bg-[#FFF5F2] px-4 py-3 text-sm text-[#A3402A]">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs underline"
          >
            cerrar
          </button>
        </div>
      )}

      {/* FILTROS */}
      <div className="flex flex-col gap-3 border border-[#E4DED3] bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8375]"
          />

          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plato..."
            className="border-[#E4DED3] pl-9"
          />
        </div>

        <Select
          value={filtroCategoria}
          onValueChange={(value) =>
            setFiltroCategoria(value ?? "todas")
          }
        >
          <SelectTrigger className="w-full border-[#E4DED3] sm:w-[210px]">
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

      {/* TABLA */}
      <div className="overflow-hidden border border-[#E4DED3] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-sm">
            <thead>
              <tr className="border-b border-[#E4DED3] bg-[#FAF8F4]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#8A8375]">
                  Plato
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#8A8375]">
                  Categoría
                </th>

                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#8A8375]">
                  Precio
                </th>


                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#8A8375]">
                  Estado
                </th>

                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {platosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Utensils
                        size={28}
                        className="text-[#B8B1A4]"
                      />

                      <p className="text-sm font-medium text-[#22201D]">
                        No hay platos
                      </p>

                      <p className="text-xs text-[#8A8375]">
                        {busqueda ||
                        filtroCategoria !== "todas"
                          ? "No encontramos platos con esos filtros."
                          : "Comienza agregando tu primer plato."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                platosFiltrados.map((plato) => (
                  <tr
                    key={plato.id}
                    className="border-b border-[#EFEAE0] last:border-0 hover:bg-[#FCFBF8]"
                  >
                    {/* PLATO */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#22201D]">
                        {plato.nombre}
                      </div>
                    </td>

                    {/* CATEGORIA */}
                    <td className="px-4 py-3 text-[#6F695E]">
                      {categoriaLabel(plato.categoria)}
                    </td>

                    {/* PRECIO */}
                    <td className="px-4 py-3 text-right font-mono">
                      {money(plato.precio)}
                    </td>

                    {/* ESTADO */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          cambiarDisponibilidad(plato)
                        }
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          plato.disponible
                            ? "bg-[#E8F1EC] text-[#2E6B4F]"
                            : "bg-[#F1EEEA] text-[#8A8375]"
                        }`}
                      >
                        <span
                          className={`mr-1.5 size-1.5 rounded-full ${
                            plato.disponible
                              ? "bg-[#2E6B4F]"
                              : "bg-[#8A8375]"
                          }`}
                        />

                        {plato.disponible
                          ? "Disponible"
                          : "No disponible"}
                      </button>
                    </td>

                    {/* ACCIONES */}
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        {/*
                         * IMPORTANTE:
                         *
                         * DropdownMenuTrigger de Base UI ya genera
                         * su propio botón.
                         *
                         * NO colocar <Button> ni <button> dentro.
                         */}
                        <DropdownMenuTrigger
                          aria-label={`Acciones para ${plato.nombre}`}
                          className="inline-flex size-8 items-center justify-center rounded-md text-[#6F695E] transition hover:bg-[#F1EEEA] hover:text-[#22201D] focus:outline-none focus:ring-2 focus:ring-[#D8D0C3]"
                        >
                          <MoreHorizontal size={17} />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="w-44"
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
                            onClick={() =>
                              eliminarPlato(plato)
                            }
                            variant="destructive"
                          >
                            <Trash2 size={15} />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PIE */}
        <div className="border-t border-[#E4DED3] bg-[#FAF8F4] px-4 py-3 text-xs text-[#8A8375]">
          Mostrando {platosFiltrados.length} de {platos.length}{" "}
          platos
        </div>
      </div>

      {/* ========================================================
          DIALOG CREAR / EDITAR
          ======================================================== */}
      <Dialog
        open={dialogoAbierto}
        onOpenChange={setDialogoAbierto}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {platoEditando ? "Editar plato" : "Nuevo plato"}
            </DialogTitle>

            <DialogDescription>
              {platoEditando
                ? "Modifica la información del plato."
                : "Agrega un nuevo plato al menú."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* NOMBRE */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="nombre"
                className="text-sm font-medium"
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
              />
            </div>

            {/* CATEGORIA */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Categoría
              </label>

              <Select
                value={formulario.categoria}
                onValueChange={(value) =>
                  setFormulario((actual) => ({
                    ...actual,
                    categoria: value ?? "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>

                <SelectContent>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="precio"
                  className="text-sm font-medium"
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
                  placeholder="25000"
                />
              </div>

    
            </div>

            {/* DISPONIBILIDAD */}
            <div className="flex items-center justify-between rounded-md border border-[#E4DED3] px-3 py-3">
              <div>
                <p className="text-sm font-medium">
                  Disponible
                </p>

                <p className="text-xs text-[#8A8375]">
                  El plato aparecerá disponible para pedidos.
                </p>
              </div>

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
                className={`relative h-6 w-11 rounded-full transition ${
                  formulario.disponible
                    ? "bg-[#2E6B4F]"
                    : "bg-[#B8B1A4]"
                }`}
              >
                <span
                  className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${
                    formulario.disponible
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogoAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={guardarPlato}
              disabled={guardando}
              className="bg-[#22201D] text-white hover:bg-[#3A3732]"
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


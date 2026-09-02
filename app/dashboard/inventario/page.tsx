"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Producto = {
  id: string;
  nombre: string;
  categoria: string | null;
  unidad: string;
  stock: number;
  costo: number;
  stock_minimo: number;
  creado_en: string;
};

type FormularioProducto = {
  nombre: string;
  categoria: string;
  unidad: string;
  stock: string;
  costo: string;
  stock_minimo: string;
};

const PRODUCTOS_POR_PAGINA = 15;

const CATEGORIAS = [
    { value: "Proteína", label: "Proteína" },
    { value: "Verdura", label: "Verdura" },
    { value: "Grano", label: "Grano" },
  ];


const UNIDADES = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "Kilogramos" },
  { value: "g", label: "Gramos" },
  { value: "litro", label: "Litros" },
  { value: "ml", label: "Mililitros" },
];

function formatoMoneda(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function obtenerCategoria(categoria: string | null) {
  if (!categoria) return "Sin categoría";

  return (
    CATEGORIAS.find((item) => item.value === categoria)?.label ??
    categoria
  );
}

function obtenerEstadoStock(stock: number, minimo: number) {
  if (stock <= 0) {
    return {
      label: "Agotado",
      className: "bg-red-50 text-red-600",
    };
  }

  if (stock <= minimo) {
    return {
      label: "Stock bajo",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: "Disponible",
    className: "bg-emerald-50 text-emerald-600",
  };
}

function formularioInicial(): FormularioProducto {
  return {
    nombre: "",
    categoria: "",
    unidad: "unidad",
    stock: "0",
    costo: "0",
    stock_minimo: "0",
  };
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [pagina, setPagina] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] =
    useState<Producto | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioProducto>(formularioInicial());

  const cargarProductos = async () => {
    try {
      setCargando(true);

      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;

      setProductos(data ?? []);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
  
    const cargar = async () => {
      try {
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .order("nombre", { ascending: true });
  
        if (error) throw error;
  
        if (!cancelado) {
          setProductos(data ?? []);
        }
      } catch (error) {
        console.error("Error cargando inventario:", error);
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };
  
    cargar();
  
    return () => {
      cancelado = true;
    };
  }, []);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideBusqueda =
        !texto ||
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria?.toLowerCase().includes(texto);

      const coincideCategoria =
        categoriaFiltro === "todas" ||
        producto.categoria === categoriaFiltro;

      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, categoriaFiltro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA)
  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const productosPagina = productosFiltrados.slice(
    (paginaActual - 1) * PRODUCTOS_POR_PAGINA,
    paginaActual * PRODUCTOS_POR_PAGINA
  );



  const abrirCrear = () => {
    setProductoEditando(null);
    setFormulario(formularioInicial());
    setModalAbierto(true);
  };

  const abrirEditar = (producto: Producto) => {
    setProductoEditando(producto);

    setFormulario({
      nombre: producto.nombre,
      categoria: producto.categoria ?? "",
      unidad: producto.unidad,
      stock: String(producto.stock),
      costo: String(producto.costo),
      stock_minimo: String(producto.stock_minimo),
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;

    setModalAbierto(false);
    setProductoEditando(null);
    setFormulario(formularioInicial());
  };

  const cambiarCampo = (
    campo: keyof FormularioProducto,
    valor: string
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formulario.nombre.trim()) {
      alert("Ingresa el nombre del producto.");
      return;
    }

    const stock = Number(formulario.stock);
    const costo = Number(formulario.costo);
    const stockMinimo = Number(formulario.stock_minimo);

    if (
      Number.isNaN(stock) ||
      Number.isNaN(costo) ||
      Number.isNaN(stockMinimo)
    ) {
      alert("Revisa los valores numéricos.");
      return;
    }

    if (stock < 0 || costo < 0 || stockMinimo < 0) {
      alert("Los valores no pueden ser negativos.");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        nombre: formulario.nombre.trim(),
        categoria: formulario.categoria || null,
        unidad: formulario.unidad,
        stock,
        costo,
        stock_minimo: stockMinimo,
      };

      if (productoEditando) {
        const { error } = await supabase
          .from("productos")
          .update(datos)
          .eq("id", productoEditando.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("productos")
          .insert(datos);

        if (error) throw error;
      }

      await cargarProductos();
      cerrarModal();
    } catch (error) {
      console.error("Error guardando producto:", error);
      alert("No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarProducto = async (producto: Producto) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${producto.nombre}"?`
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", producto.id);

      if (error) throw error;

      setProductos((actuales) =>
        actuales.filter((item) => item.id !== producto.id)
      );
    } catch (error) {
      console.error("Error eliminando producto:", error);
      alert("No se pudo eliminar el producto.");
    }
  };

  const cambiarBusqueda = (valor: string) => {
    setBusqueda(valor);
    setPagina(1);
  };

  const cambiarCategoria = (valor: string) => {
    setCategoriaFiltro(valor);
    setPagina(1);
  };

  return (
    <main className="min-h-full bg-[#FAF7F1] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ENCABEZADO */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#B91C1C]" />

              <h1 className="text-2xl font-bold tracking-tight text-[#201D18]">
                Inventario
              </h1>
            </div>

            <p className="text-sm text-[#817A70]">
              Administra los productos y existencias del restaurante.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirCrear}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#B91C1C] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#991B1B] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>

        {/* FILTROS */}
        <div className="mb-5 rounded-2xl border border-[#E4DED3] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9389]" />

              <input
                type="text"
                value={busqueda}
                onChange={(e) => cambiarBusqueda(e.target.value)}
                placeholder="Buscar producto..."
                className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] pl-10 pr-4 text-sm text-[#201D18] outline-none transition placeholder:text-[#AAA39A] focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
              />
            </div>

            <select
              value={categoriaFiltro}
              onChange={(e) => cambiarCategoria(e.target.value)}
              className="h-10 rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
            >
              <option value="todas">Todas las categorías</option>

              {CATEGORIAS.map((categoria) => (
                <option
                  key={categoria.value}
                  value={categoria.value}
                >
                  {categoria.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLA */}
        <div className="overflow-hidden rounded-2xl border border-[#E4DED3] bg-white shadow-sm">
          {cargando ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#B91C1C]" />
            </div>
          ) : productosPagina.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F1EA]">
                <Package className="h-5 w-5 text-[#817A70]" />
              </div>

              <h3 className="font-semibold text-[#201D18]">
                No hay productos
              </h3>

              <p className="mt-1 text-sm text-[#817A70]">
                {busqueda || categoriaFiltro !== "todas"
                  ? "No encontramos productos con esos filtros."
                  : "Agrega tu primer producto al inventario."}
              </p>
            </div>
          ) : (
            <>
              {/* TABLA DESKTOP */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4DED3] bg-[#FCFAF7]">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                        Producto
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                        Categoría
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                        Stock
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                        Costo
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                        Estado
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#817A70]">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EEE9E1]">
                    {productosPagina.map((producto) => {
                      const estado = obtenerEstadoStock(
                        Number(producto.stock),
                        Number(producto.stock_minimo)
                      );

                      return (
                        <tr
                          key={producto.id}
                          className="transition hover:bg-[#FCFAF7]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#201D18]">
                              {producto.nombre}
                            </div>

                            <div className="mt-0.5 text-xs text-[#9A9389]">
                              Unidad: {producto.unidad}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-[#5F5A53]">
                            {obtenerCategoria(producto.categoria)}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-semibold text-[#201D18]">
                              {producto.stock}
                            </span>

                            <span className="ml-1 text-sm text-[#817A70]">
                              {producto.unidad}
                            </span>

                            <div className="mt-1 text-xs text-[#9A9389]">
                              Mínimo: {producto.stock_minimo}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-[#201D18]">
                            {formatoMoneda(Number(producto.costo))}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                            >
                              {estado.label}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => abrirEditar(producto)}
                                title="Editar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#817A70] transition hover:bg-[#F3EEE6] hover:text-[#201D18]"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => eliminarProducto(producto)}
                                title="Eliminar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#817A70] transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* CARDS MOBILE */}
              <div className="divide-y divide-[#EEE9E1] md:hidden">
                {productosPagina.map((producto) => {
                  const estado = obtenerEstadoStock(
                    Number(producto.stock),
                    Number(producto.stock_minimo)
                  );

                  return (
                    <div
                      key={producto.id}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-[#201D18]">
                            {producto.nombre}
                          </h3>

                          <p className="mt-1 text-xs text-[#817A70]">
                            {obtenerCategoria(producto.categoria)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                        >
                          {estado.label}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#FCFAF7] p-3">
                          <p className="text-xs text-[#9A9389]">
                            Stock
                          </p>

                          <p className="mt-1 font-semibold text-[#201D18]">
                            {producto.stock}{" "}
                            <span className="text-xs font-normal text-[#817A70]">
                              {producto.unidad}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#FCFAF7] p-3">
                          <p className="text-xs text-[#9A9389]">
                            Costo
                          </p>

                          <p className="mt-1 font-semibold text-[#201D18]">
                            {formatoMoneda(Number(producto.costo))}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEditar(producto)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E4DED3] px-3 text-xs font-semibold text-[#5F5A53] transition hover:bg-[#F8F5EF]"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarProducto(producto)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINACIÓN */}
              <div className="flex items-center justify-between border-t border-[#E4DED3] px-4 py-3 sm:px-5">
                <p className="text-xs text-[#817A70]">
                  {productosFiltrados.length} producto
                  {productosFiltrados.length !== 1 ? "s" : ""}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagina === 1}
                    onClick={() => setPagina((actual) => actual - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4DED3] text-[#5F5A53] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="text-xs font-medium text-[#5F5A53]">
                  {paginaActual} / {totalPaginas}
                  </span>

                  <button
                    type="button"
                    disabled={pagina === totalPaginas}
                    onClick={() => setPagina((actual) => actual + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4DED3] text-[#5F5A53] transition hover:bg-[#F8F5EF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="border-b border-[#E4DED3] px-5 py-4">
              <h2 className="text-lg font-bold text-[#201D18]">
                {productoEditando
                  ? "Editar producto"
                  : "Nuevo producto"}
              </h2>

              <p className="mt-1 text-sm text-[#817A70]">
                {productoEditando
                  ? "Actualiza la información del producto."
                  : "Registra un nuevo producto en el inventario."}
              </p>
            </div>

            <form onSubmit={guardarProducto}>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
                {/* NOMBRE */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                    Nombre
                  </label>

                  <input
                    type="text"
                    value={formulario.nombre}
                    onChange={(e) =>
                      cambiarCampo("nombre", e.target.value)
                    }
                    placeholder="Ej. Carne de res"
                    className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition placeholder:text-[#AAA39A] focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                  />
                </div>

                {/* CATEGORIA + UNIDAD */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                      Categoría
                    </label>

                    <select
                      value={formulario.categoria}
                      onChange={(e) =>
                        cambiarCampo("categoria", e.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                    >
                      <option value="">Sin categoría</option>

                      {CATEGORIAS.map((categoria) => (
                        <option
                          key={categoria.value}
                          value={categoria.value}
                        >
                          {categoria.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                      Unidad
                    </label>

                    <select
                      value={formulario.unidad}
                      onChange={(e) =>
                        cambiarCampo("unidad", e.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                    >
                      {UNIDADES.map((unidad) => (
                        <option
                          key={unidad.value}
                          value={unidad.value}
                        >
                          {unidad.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* STOCK */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                      Stock actual
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formulario.stock}
                      onChange={(e) =>
                        cambiarCampo("stock", e.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                      Stock mínimo
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formulario.stock_minimo}
                      onChange={(e) =>
                        cambiarCampo(
                          "stock_minimo",
                          e.target.value
                        )
                      }
                      className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] px-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                    />
                  </div>
                </div>

                {/* COSTO */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#3D3933]">
                    Costo
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#817A70]">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formulario.costo}
                      onChange={(e) =>
                        cambiarCampo("costo", e.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-[#E4DED3] bg-[#FCFAF7] pl-7 pr-3 text-sm text-[#201D18] outline-none transition focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/10"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2 border-t border-[#E4DED3] bg-[#FCFAF7] px-5 py-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="h-10 rounded-xl border border-[#E4DED3] bg-white px-4 text-sm font-semibold text-[#5F5A53] transition hover:bg-[#F8F5EF] disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#B91C1C] px-4 text-sm font-semibold text-white transition hover:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {productoEditando ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  Search,
  Utensils,
  X,
  Check,
  Loader2,
  Trash2,
  Pencil,
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mesa = {
  id: string;
  nombre: string;
  activa: boolean;
};

type Plato = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  disponible: boolean;
};

type Comanda = {
  id: string;
  mesa_id: string | null;
  mesero_id: string | null;
  estado: string;
};

type ComandaItem = {
  id: string;
  comanda_id: string;
  plato_id: string;
  cantidad: number;
  precio_unitario: number;
  estado: string;
  observaciones: string | null;
};

type ItemSeleccionado = {
  plato_id: string;
  nombre: string;
  categoria: string;
  precio: number;
  cantidad: number;
};

const categorias = [
  {
    value: "desayuno",
    label: "Desayunos",
  },
  {
    value: "almuerzo",
    label: "Almuerzos",
  },
  {
    value: "bebida",
    label: "Bebidas",
  },
  {
    value: "adicional",
    label: "Adicionales",
  },
];

const money = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(n) || 0));

export default function MesasPage() {
  const router = useRouter();

  // ============================================================
  // DATOS
  // ============================================================

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);

  // ============================================================
  // ESTADOS
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [creandoMesa, setCreandoMesa] = useState(false);
  const [eliminandoMesa, setEliminandoMesa] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // USUARIO / ROL
  // ============================================================

  const [esAdmin, setEsAdmin] = useState(false);

  // ============================================================
  // MESA SELECCIONADA
  // ============================================================

  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);

  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  // ============================================================
  // COMANDA
  // ============================================================

  const [itemsSeleccionados, setItemsSeleccionados] = useState<
    ItemSeleccionado[]
  >([]);

  const [busqueda, setBusqueda] = useState("");

  // ============================================================
  // CREAR / EDITAR MESA
  // ============================================================

  const [dialogoCrearMesa, setDialogoCrearMesa] = useState(false);

  const [dialogoEditarMesa, setDialogoEditarMesa] = useState(false);

  const [mesaEditando, setMesaEditando] = useState<Mesa | null>(null);

  const [numeroMesa, setNumeroMesa] = useState("");

  // ============================================================
  // OBTENER TOKEN
  // ============================================================

  const obtenerToken = useCallback(() => {
    const sesionGuardada = sessionStorage.getItem("sesion");

    if (!sesionGuardada) {
      router.push("/login");
      return null;
    }

    try {
      const sesion = JSON.parse(sesionGuardada);

      if (!sesion?.token) {
        sessionStorage.removeItem("sesion");
        router.push("/login");
        return null;
      }

      return sesion.token as string;
    } catch {
      sessionStorage.removeItem("sesion");
      router.push("/login");
      return null;
    }
  }, [router]);

  // ============================================================
  // OBTENER ROL DEL USUARIO
  // ============================================================

  const cargarRolUsuario = useCallback(async (token: string) => {
    try {
      const supabase = createAuthedClient(token);

      // Usamos la misma función que utiliza RLS
      // para determinar el rol real del usuario.
      const { data: rol, error } = await supabase.rpc("rol_actual");

      if (error) {
        console.error("Error obteniendo rol mediante rol_actual():", error);

        setEsAdmin(false);
        return;
      }

      console.log("Rol actual:", rol);

      setEsAdmin(String(rol).toLowerCase() === "admin");
    } catch (err) {
      console.error("Error obteniendo rol:", err);

      setEsAdmin(false);
    }
  }, []);

  // ============================================================
  // CARGAR DATOS
  // ============================================================

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = obtenerToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      await cargarRolUsuario(token);

      const supabase = createAuthedClient(token);

      const [
        { data: mesasData, error: mesasError },
        { data: platosData, error: platosError },
        { data: comandasData, error: comandasError },
      ] = await Promise.all([
        // --------------------------------------------------------
        // MESAS ACTIVAS
        // --------------------------------------------------------

        supabase
          .from("mesas")
          .select("id, nombre, activa")
          .eq("activa", true)
          .order("nombre", {
            ascending: true,
          }),

        // --------------------------------------------------------
        // PLATOS DISPONIBLES
        // --------------------------------------------------------

        supabase
          .from("platos")
          .select("id, nombre, categoria, precio, disponible")
          .eq("disponible", true)
          .order("categoria", {
            ascending: true,
          })
          .order("nombre", {
            ascending: true,
          }),

        // --------------------------------------------------------
        // COMANDAS ABIERTAS
        // --------------------------------------------------------

        supabase
          .from("comandas")
          .select("id, mesa_id, mesero_id, estado")
          .eq("estado", "abierta")
          .not("mesa_id", "is", null),
      ]);

      if (mesasError) {
        console.error("Error cargando mesas:", mesasError);

        setError(mesasError.message);
        return;
      }

      if (platosError) {
        console.error("Error cargando platos:", platosError);

        setError(platosError.message);
        return;
      }

      if (comandasError) {
        console.error("Error cargando comandas:", comandasError);

        setError(comandasError.message);
        return;
      }

      setMesas(
        ((mesasData as Mesa[]) ?? []).sort((a, b) =>
          a.nombre.localeCompare(b.nombre, undefined, {
            numeric: true,
          }),
        ),
      );

      setPlatos((platosData as Plato[]) ?? []);

      setComandas((comandasData as Comanda[]) ?? []);
    } catch (err) {
      console.error(err);

      setError("No se pudo cargar la información de las mesas.");
    } finally {
      setLoading(false);
    }
  }, [obtenerToken, cargarRolUsuario]);

  // ============================================================
  // CARGAR AL INICIAR
  // ============================================================

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // ============================================================
  // DETERMINAR SI MESA ESTÁ OCUPADA
  // ============================================================

  const estaOcupada = useCallback(
    (mesaId: string) => {
      return comandas.some(
        (comanda) => comanda.mesa_id === mesaId && comanda.estado === "abierta",
      );
    },
    [comandas],
  );

  // ============================================================
  // OBTENER COMANDA DE UNA MESA
  // ============================================================

  const obtenerComandaMesa = useCallback(
    (mesaId: string) => {
      return (
        comandas.find(
          (comanda) =>
            comanda.mesa_id === mesaId && comanda.estado === "abierta",
        ) ?? null
      );
    },
    [comandas],
  );

  // ============================================================
  // BUSCAR PLATOS
  // ============================================================

  const platosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      return platos;
    }

    return platos.filter((plato) => plato.nombre.toLowerCase().includes(texto));
  }, [platos, busqueda]);

  // ============================================================
  // AGRUPAR POR CATEGORÍA
  // ============================================================

  const platosPorCategoria = useMemo(() => {
    return categorias.map((categoria) => ({
      ...categoria,
      platos: platosFiltrados.filter(
        (plato) => plato.categoria === categoria.value,
      ),
    }));
  }, [platosFiltrados]);

  // ============================================================
  // TOTAL
  // ============================================================

  const total = useMemo(() => {
    return itemsSeleccionados.reduce(
      (acumulado, item) => acumulado + item.precio * item.cantidad,
      0,
    );
  }, [itemsSeleccionados]);

  // ============================================================
  // CANTIDAD DE UN PLATO
  // ============================================================

  const cantidadPlato = useCallback(
    (platoId: string) => {
      return (
        itemsSeleccionados.find((item) => item.plato_id === platoId)
          ?.cantidad ?? 0
      );
    },
    [itemsSeleccionados],
  );

  // ============================================================
  // CARGAR ITEMS DE COMANDA
  // ============================================================

  const cargarItemsComanda = async (comandaId: string, token: string) => {
    const supabase = createAuthedClient(token);

    const { data, error: errorItems } = await supabase
      .from("comanda_items")
      .select(
        "id, comanda_id, plato_id, cantidad, precio_unitario, estado, observaciones",
      )
      .eq("comanda_id", comandaId)
      .order("creado_en", {
        ascending: true,
      });

    if (errorItems) {
      console.error("Error cargando items:", errorItems);

      throw new Error(errorItems.message);
    }

    const items = (data as ComandaItem[]) ?? [];

    return items.map((item) => {
      const plato = platos.find((p) => p.id === item.plato_id);

      return {
        plato_id: item.plato_id,
        nombre: plato?.nombre ?? "Plato",
        categoria: plato?.categoria ?? "",
        precio: Number(item.precio_unitario),
        cantidad: item.cantidad,
      };
    });
  };

  // ============================================================
  // ABRIR MESA
  // ============================================================

  const abrirMesa = async (mesa: Mesa) => {
    setError(null);
    setMesaSeleccionada(mesa);
    setBusqueda("");

    const comandaExistente = obtenerComandaMesa(mesa.id);

    if (!comandaExistente) {
      setItemsSeleccionados([]);
      setDialogoAbierto(true);
      return;
    }

    const token = obtenerToken();

    if (!token) {
      return;
    }

    try {
      setGuardando(true);

      const items = await cargarItemsComanda(comandaExistente.id, token);

      setItemsSeleccionados(items);
      setDialogoAbierto(true);
    } catch (err) {
      console.error(err);

      setError("No se pudo cargar la comanda de la mesa.");
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // CERRAR DIÁLOGO
  // ============================================================

  const cerrarDialogo = () => {
    if (guardando) return;

    setDialogoAbierto(false);
    setMesaSeleccionada(null);
    setItemsSeleccionados([]);
    setBusqueda("");
  };

  // ============================================================
  // AGREGAR PLATO
  // ============================================================

  const agregarPlato = (plato: Plato) => {
    setItemsSeleccionados((actuales) => {
      const existente = actuales.find((item) => item.plato_id === plato.id);

      if (existente) {
        return actuales.map((item) =>
          item.plato_id === plato.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item,
        );
      }

      return [
        ...actuales,
        {
          plato_id: plato.id,
          nombre: plato.nombre,
          categoria: plato.categoria,
          precio: Number(plato.precio),
          cantidad: 1,
        },
      ];
    });
  };

  // ============================================================
  // QUITAR UNA UNIDAD
  // ============================================================

  const quitarPlato = (platoId: string) => {
    setItemsSeleccionados((actuales) =>
      actuales
        .map((item) =>
          item.plato_id === platoId
            ? {
                ...item,
                cantidad: item.cantidad - 1,
              }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    );
  };

  // ============================================================
  // ELIMINAR PLATO
  // ============================================================

  const eliminarPlatoSeleccionado = (platoId: string) => {
    setItemsSeleccionados((actuales) =>
      actuales.filter((item) => item.plato_id !== platoId),
    );
  };

  // ============================================================
  // ABRIR CREAR MESA
  // ============================================================

  const abrirCrearMesa = () => {
    setError(null);
    setNumeroMesa("");
    setDialogoCrearMesa(true);
  };

  // ============================================================
  // CREAR MESA
  // ============================================================

  const crearMesa = async () => {
    const numero = numeroMesa.trim();

    if (!numero) {
      setError("Ingresa el número de la mesa.");
      return;
    }

    if (!/^\d+$/.test(numero)) {
      setError("El número de mesa debe contener únicamente números.");
      return;
    }

    const numeroNormalizado = String(Number(numero));

    const nombre = `Mesa ${numeroNormalizado}`;

    const yaExiste = mesas.some(
      (mesa) => mesa.nombre.toLowerCase() === nombre.toLowerCase(),
    );

    if (yaExiste) {
      setError(`La ${nombre} ya existe.`);
      return;
    }

    const token = obtenerToken();

    if (!token) return;

    setError(null);
    setCreandoMesa(true);

    try {
      const supabase = createAuthedClient(token);

      const { data, error } = await supabase
        .from("mesas")
        .insert({
          nombre,
          activa: true,
        })
        .select("id, nombre, activa")
        .single();

      if (error) {
        console.error("Error creando mesa:", error);

        setError(error.message);
        return;
      }

      setMesas((actuales) =>
        [...actuales, data as Mesa].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, undefined, {
            numeric: true,
          }),
        ),
      );

      setNumeroMesa("");
      setDialogoCrearMesa(false);
    } catch (err) {
      console.error(err);

      setError("No se pudo crear la mesa.");
    } finally {
      setCreandoMesa(false);
    }
  };

  // ============================================================
  // ABRIR EDITAR MESA
  // ============================================================

  const abrirEditarMesa = (e: React.MouseEvent, mesa: Mesa) => {
    e.stopPropagation();

    if (!esAdmin) return;

    setError(null);

    const numero = mesa.nombre.replace(/^mesa\s*/i, "");

    setMesaEditando(mesa);
    setNumeroMesa(numero);
    setDialogoEditarMesa(true);
  };

  // ============================================================
  // EDITAR MESA
  // ============================================================

  const editarMesa = async () => {
    if (!mesaEditando) {
      return;
    }

    const numero = numeroMesa.trim();

    if (!numero) {
      setError("Ingresa el número de la mesa.");
      return;
    }

    if (!/^\d+$/.test(numero)) {
      setError("El número de mesa debe contener únicamente números.");
      return;
    }

    const numeroNormalizado = String(Number(numero));

    const nombre = `Mesa ${numeroNormalizado}`;

    const yaExiste = mesas.some(
      (mesa) =>
        mesa.id !== mesaEditando.id &&
        mesa.nombre.toLowerCase() === nombre.toLowerCase(),
    );

    if (yaExiste) {
      setError(`La ${nombre} ya existe.`);
      return;
    }

    const token = obtenerToken();

    if (!token) return;

    setGuardando(true);
    setError(null);

    try {
      const supabase = createAuthedClient(token);

      const { data, error } = await supabase
        .from("mesas")
        .update({
          nombre,
        })
        .eq("id", mesaEditando.id)
        .select("id, nombre, activa")
        .single();

      if (error) {
        console.error("Error editando mesa:", error);

        throw new Error(error.message);
      }

      setMesas((actuales) =>
        actuales
          .map((mesa) => (mesa.id === mesaEditando.id ? (data as Mesa) : mesa))
          .sort((a, b) =>
            a.nombre.localeCompare(b.nombre, undefined, {
              numeric: true,
            }),
          ),
      );

      setDialogoEditarMesa(false);
      setMesaEditando(null);
      setNumeroMesa("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "No se pudo editar la mesa.",
      );
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // ELIMINAR MESA
  // ============================================================

  const eliminarMesa = async (e: React.MouseEvent, mesa: Mesa) => {
    e.stopPropagation();

    if (!esAdmin) return;

    const ocupada = estaOcupada(mesa.id);

    if (ocupada) {
      setError(
        `No puedes eliminar ${mesa.nombre} porque tiene una comanda abierta.`,
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar ${mesa.nombre}?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmar) {
      return;
    }

    const token = obtenerToken();

    if (!token) return;

    setEliminandoMesa(true);
    setError(null);

    try {
      const supabase = createAuthedClient(token);

      const { error } = await supabase.from("mesas").delete().eq("id", mesa.id);

      if (error) {
        console.error("Error eliminando mesa:", error);

        throw new Error(error.message);
      }

      setMesas((actuales) => actuales.filter((m) => m.id !== mesa.id));
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "No se pudo eliminar la mesa.",
      );
    } finally {
      setEliminandoMesa(false);
    }
  };

  // ============================================================
  // CONFIRMAR COMANDA
  // ============================================================

  const confirmarComanda = async () => {
    if (!mesaSeleccionada) {
      return;
    }

    if (itemsSeleccionados.length === 0) {
      setError("Agrega al menos un plato a la comanda.");
      return;
    }

    const token = obtenerToken();

    if (!token) return;

    setError(null);
    setGuardando(true);

    try {
      const supabase = createAuthedClient(token);

      const { data: userData } = await supabase.auth.getUser();

      const usuarioId = userData.user?.id;

      if (!usuarioId) {
        throw new Error("No se pudo identificar al mesero.");
      }

      let comanda = obtenerComandaMesa(mesaSeleccionada.id);

      // ======================================================
      // MESA LIBRE
      // ======================================================

      if (!comanda) {
        const { data: nuevaComanda, error: errorComanda } = await supabase
          .from("comandas")
          .insert({
            canal: "salon",
            mesa_id: mesaSeleccionada.id,
            mesero_id: usuarioId,
            estado: "abierta",
          })
          .select("id, mesa_id, mesero_id, estado")
          .single();

        if (errorComanda || !nuevaComanda) {
          console.error("Error creando comanda:", errorComanda);

          if (errorComanda?.code === "23505") {
            await cargarDatos();

            throw new Error("Esta mesa acaba de ser ocupada por otro mesero.");
          }

          throw new Error(
            errorComanda?.message ?? "No se pudo crear la comanda.",
          );
        }

        comanda = nuevaComanda as Comanda;

        const itemsParaInsertar = itemsSeleccionados.map((item) => ({
          comanda_id: comanda!.id,
          plato_id: item.plato_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          estado: "pendiente",
        }));

        const { error: errorItems } = await supabase
          .from("comanda_items")
          .insert(itemsParaInsertar);

        if (errorItems) {
          await supabase
            .from("comanda_items")
            .delete()
            .eq("comanda_id", comanda.id);

          await supabase.from("comandas").delete().eq("id", comanda.id);

          throw new Error(errorItems.message);
        }
      }

      // ======================================================
      // COMANDA EXISTENTE
      // ======================================================
      else {
        const { data: itemsActualesData, error: errorItemsActuales } =
          await supabase
            .from("comanda_items")
            .select(
              "id, comanda_id, plato_id, cantidad, precio_unitario, estado, observaciones",
            )
            .eq("comanda_id", comanda.id);

        if (errorItemsActuales) {
          throw new Error(errorItemsActuales.message);
        }

        const itemsActuales = (itemsActualesData as ComandaItem[]) ?? [];

        const seleccionadosMap = new Map(
          itemsSeleccionados.map((item) => [item.plato_id, item]),
        );

        // ----------------------------------------------------
        // ELIMINAR ITEMS
        // ----------------------------------------------------

        for (const itemActual of itemsActuales) {
          if (!seleccionadosMap.has(itemActual.plato_id)) {
            const { error: errorDelete } = await supabase
              .from("comanda_items")
              .delete()
              .eq("id", itemActual.id);

            if (errorDelete) {
              throw new Error(errorDelete.message);
            }
          }
        }

        // ----------------------------------------------------
        // ACTUALIZAR / INSERTAR
        // ----------------------------------------------------

        for (const itemSeleccionado of itemsSeleccionados) {
          const itemExistente = itemsActuales.find(
            (item) => item.plato_id === itemSeleccionado.plato_id,
          );

          if (itemExistente) {
            if (itemExistente.cantidad !== itemSeleccionado.cantidad) {
              const { error: errorUpdate } = await supabase
                .from("comanda_items")
                .update({
                  cantidad: itemSeleccionado.cantidad,
                })
                .eq("id", itemExistente.id);

              if (errorUpdate) {
                throw new Error(errorUpdate.message);
              }
            }
          } else {
            const { error: errorInsert } = await supabase
              .from("comanda_items")
              .insert({
                comanda_id: comanda.id,
                plato_id: itemSeleccionado.plato_id,
                cantidad: itemSeleccionado.cantidad,
                precio_unitario: itemSeleccionado.precio,
                estado: "pendiente",
              });

            if (errorInsert) {
              throw new Error(errorInsert.message);
            }
          }
        }
      }

      await cargarDatos();

      setDialogoAbierto(false);
      setMesaSeleccionada(null);
      setItemsSeleccionados([]);
      setBusqueda("");
    } catch (err) {
      console.error("Error confirmando comanda:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al confirmar la comanda.",
      );
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // LIBERAR MESA
  // ============================================================

  const liberarMesa = async () => {
    if (!mesaSeleccionada) {
      return;
    }

    const comanda = obtenerComandaMesa(mesaSeleccionada.id);

    if (!comanda) {
      cerrarDialogo();
      return;
    }

    const confirmar = window.confirm(
      `¿Liberar ${mesaSeleccionada.nombre}?\n\nLa comanda actual se eliminará junto con sus productos y la mesa quedará libre.`,
    );

    if (!confirmar) {
      return;
    }

    const token = obtenerToken();

    if (!token) return;

    setGuardando(true);
    setError(null);

    try {
      const supabase = createAuthedClient(token);

      const { error: errorItems } = await supabase
        .from("comanda_items")
        .delete()
        .eq("comanda_id", comanda.id);

      if (errorItems) {
        throw new Error(errorItems.message);
      }

      const { error: errorComanda } = await supabase
        .from("comandas")
        .delete()
        .eq("id", comanda.id);

      if (errorComanda) {
        throw new Error(errorComanda.message);
      }

      setComandas((actuales) => actuales.filter((c) => c.id !== comanda.id));

      cerrarDialogo();
    } catch (err) {
      console.error("Error liberando mesa:", err);

      setError(
        err instanceof Error ? err.message : "No se pudo liberar la mesa.",
      );
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <div className="flex items-center gap-2 text-sm text-[#8A8375]">
          <Loader2 size={16} className="animate-spin" />
          Cargando mesas...
        </div>
      </main>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      {/* ======================================================
          ENCABEZADO
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[#22201D]">Mesas</h1>

          <p className="mt-1 text-sm text-[#8A8375]">
            Selecciona una mesa para crear o continuar una comanda.
          </p>
        </div>

        {esAdmin && (
          <Button
            type="button"
            onClick={abrirCrearMesa}
            className="bg-[#22201D] text-white hover:bg-[#3A3732]"
          >
            <Plus size={16} />
            Nueva mesa
          </Button>
        )}
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-center justify-between border border-[#E7B8AD] bg-[#FFF5F2] px-4 py-3 text-sm text-[#A3402A]">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-4 text-xs underline"
          >
            cerrar
          </button>
        </div>
      )}

      {/* ======================================================
          RESUMEN
      ====================================================== */}

      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 rounded-full bg-[#E8F1EC] px-3 py-1.5 text-[#2E6B4F]">
          <span className="size-2 rounded-full bg-[#2E6B4F]" />
          {mesas.filter((mesa) => !estaOcupada(mesa.id)).length} libres
        </div>

        <div className="flex items-center gap-2 rounded-full bg-[#F1EEEA] px-3 py-1.5 text-[#6F695E]">
          <span className="size-2 rounded-full bg-[#6F695E]" />
          {mesas.filter((mesa) => estaOcupada(mesa.id)).length} ocupadas
        </div>
      </div>

      {/* ======================================================
          MESAS
      ====================================================== */}

      {mesas.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center border border-[#E4DED3] bg-white">
          <Utensils size={32} className="text-[#B8B1A4]" />

          <p className="mt-3 text-sm font-medium text-[#22201D]">
            No hay mesas
          </p>

          <p className="mt-1 text-xs text-[#8A8375]">
            Crea tu primera mesa para comenzar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mesas.map((mesa) => {
            const ocupada = estaOcupada(mesa.id);

            return (
              <div
                key={mesa.id}
                className={`group relative flex min-h-[150px] flex-col items-center justify-center rounded-lg border bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  ocupada ? "border-[#D8D0C3]" : "border-[#E4DED3]"
                }`}
              >
                {/* ==================================================
                    ACCIONES ADMIN
                ================================================== */}

                {esAdmin && (
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => abrirEditarMesa(e, mesa)}
                      className="flex size-7 items-center justify-center rounded-md border border-[#E4DED3] bg-white text-[#6F695E] transition hover:bg-[#F5F2ED] hover:text-[#22201D]"
                      title="Editar mesa"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => void eliminarMesa(e, mesa)}
                      disabled={eliminandoMesa || ocupada}
                      className="flex size-7 items-center justify-center rounded-md border border-[#E4DED3] bg-white text-[#A3402A] transition hover:bg-[#FFF5F2] disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        ocupada
                          ? "No puedes eliminar una mesa ocupada"
                          : "Eliminar mesa"
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}

                {/* ==================================================
                    BOTÓN DE LA MESA
                ================================================== */}

                <button
                  type="button"
                  onClick={() => void abrirMesa(mesa)}
                  className="flex w-full flex-1 flex-col items-center justify-center"
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-[#8A8375]">
                    Mesa
                  </span>

                  <span className="mt-1 font-serif text-3xl text-[#22201D]">
                    {mesa.nombre.replace(/^mesa\s*/i, "")}
                  </span>

                  <span
                    className={`mt-4 rounded-full px-3 py-1 text-[11px] font-medium ${
                      ocupada
                        ? "bg-[#F1EEEA] text-[#6F695E]"
                        : "bg-[#E8F1EC] text-[#2E6B4F]"
                    }`}
                  >
                    {ocupada ? "Ocupada" : "Libre"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================
          DIALOG CREAR MESA
      ====================================================== */}

      <Dialog open={dialogoCrearMesa} onOpenChange={setDialogoCrearMesa}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-serif">Nueva mesa</DialogTitle>

            <DialogDescription>
              Ingresa únicamente el número de la mesa.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <label htmlFor="numeroMesa" className="text-sm font-medium">
              Número de mesa
            </label>

            <Input
              id="numeroMesa"
              type="number"
              min="1"
              step="1"
              value={numeroMesa}
              onChange={(e) => setNumeroMesa(e.target.value)}
              placeholder="Ej. 5"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void crearMesa();
                }
              }}
            />

            <p className="mt-2 text-xs text-[#8A8375]">
              La mesa se guardará automáticamente como{" "}
              <strong>Mesa {numeroMesa || "X"}</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogoCrearMesa(false)}
              disabled={creandoMesa}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={() => void crearMesa()}
              disabled={creandoMesa}
              className="bg-[#22201D] text-white hover:bg-[#3A3732]"
            >
              {creandoMesa ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus size={15} />
                  Crear mesa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================
          DIALOG EDITAR MESA
      ====================================================== */}

      <Dialog open={dialogoEditarMesa} onOpenChange={setDialogoEditarMesa}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-serif">Editar mesa</DialogTitle>

            <DialogDescription>
              Cambia el número de la mesa. El nombre se actualizará
              automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <label htmlFor="numeroMesaEditar" className="text-sm font-medium">
              Número de mesa
            </label>

            <Input
              id="numeroMesaEditar"
              type="number"
              min="1"
              step="1"
              value={numeroMesa}
              onChange={(e) => setNumeroMesa(e.target.value)}
              placeholder="Ej. 5"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void editarMesa();
                }
              }}
            />

            <p className="mt-2 text-xs text-[#8A8375]">
              Se guardará como <strong>Mesa {numeroMesa || "X"}</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogoEditarMesa(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={() => void editarMesa()}
              disabled={guardando}
              className="bg-[#22201D] text-white hover:bg-[#3A3732]"
            >
              {guardando ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check size={15} />
                  Guardar cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================
          DIALOG COMANDA
      ====================================================== */}

      <Dialog
        open={dialogoAbierto}
        onOpenChange={(open) => {
          if (!open) {
            cerrarDialogo();
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[950px]">
          {/* ==================================================
              HEADER
          ================================================== */}

          <DialogHeader className="border-b border-[#E4DED3] px-6 py-5">
            <DialogTitle className="font-serif text-xl">
              Mesa {mesaSeleccionada?.nombre.replace(/^mesa\s*/i, "")}
            </DialogTitle>

            <DialogDescription>
              {mesaSeleccionada && estaOcupada(mesaSeleccionada.id)
                ? "Continúa agregando productos a la comanda."
                : "Selecciona los productos y confirma para enviar la comanda a cocina."}
            </DialogDescription>
          </DialogHeader>

          {/* ==================================================
              CONTENIDO
          ================================================== */}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* ================================================
                PLATOS
            ================================================= */}

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-5">
                <div className="relative">
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
              </div>

              <div className="flex flex-col gap-7">
                {platosPorCategoria.map((categoria) => {
                  if (categoria.platos.length === 0) {
                    return null;
                  }

                  return (
                    <section key={categoria.value}>
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6F695E]">
                          {categoria.label}
                        </h3>

                        <div className="h-px flex-1 bg-[#E4DED3]" />
                      </div>

                      <div className="grid gap-2">
                        {categoria.platos.map((plato) => {
                          const cantidad = cantidadPlato(plato.id);

                          return (
                            <div
                              key={plato.id}
                              className="flex items-center justify-between rounded-md border border-[#E4DED3] bg-white px-3 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[#22201D]">
                                  {plato.nombre}
                                </p>

                                <p className="mt-0.5 font-mono text-xs text-[#8A8375]">
                                  {money(Number(plato.precio))}
                                </p>
                              </div>

                              <div className="ml-4 flex items-center gap-2">
                                {cantidad > 0 && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="size-7"
                                      onClick={() => quitarPlato(plato.id)}
                                    >
                                      <Minus size={14} />
                                    </Button>

                                    <span className="w-5 text-center text-sm font-medium">
                                      {cantidad}
                                    </span>
                                  </>
                                )}

                                <Button
                                  type="button"
                                  size="icon"
                                  className="size-7 bg-[#22201D] text-white hover:bg-[#3A3732]"
                                  onClick={() => agregarPlato(plato)}
                                >
                                  <Plus size={14} />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

                {platosFiltrados.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Search size={28} className="text-[#B8B1A4]" />

                    <p className="mt-3 text-sm font-medium text-[#22201D]">
                      No encontramos platos
                    </p>

                    <p className="mt-1 text-xs text-[#8A8375]">
                      Prueba con otro término de búsqueda.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ================================================
                COMANDA
            ================================================= */}

            <div className="flex w-full flex-col border-t border-[#E4DED3] bg-[#FAF8F4] lg:w-[350px] lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between border-b border-[#E4DED3] px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#22201D]">
                    Comanda
                  </h3>

                  <p className="mt-0.5 text-xs text-[#8A8375]">
                    {itemsSeleccionados.length}{" "}
                    {itemsSeleccionados.length === 1 ? "producto" : "productos"}
                  </p>
                </div>

                <Utensils size={18} className="text-[#8A8375]" />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {itemsSeleccionados.length === 0 ? (
                  <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                    <Utensils size={26} className="text-[#B8B1A4]" />

                    <p className="mt-3 text-sm font-medium text-[#22201D]">
                      Comanda vacía
                    </p>

                    <p className="mt-1 max-w-[200px] text-xs text-[#8A8375]">
                      Selecciona platos para agregarlos a la comanda.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {itemsSeleccionados.map((item) => (
                      <div
                        key={item.plato_id}
                        className="border-b border-[#E4DED3] pb-3 last:border-0"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#22201D]">
                              {item.nombre}
                            </p>

                            <p className="mt-0.5 text-xs text-[#8A8375]">
                              {item.cantidad} × {money(item.precio)}
                            </p>
                          </div>

                          <p className="whitespace-nowrap font-mono text-sm text-[#22201D]">
                            {money(item.precio * item.cantidad)}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7"
                            onClick={() => quitarPlato(item.plato_id)}
                          >
                            <Minus size={13} />
                          </Button>

                          <span className="w-5 text-center text-xs">
                            {item.cantidad}
                          </span>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7"
                            onClick={() => {
                              const plato = platos.find(
                                (p) => p.id === item.plato_id,
                              );

                              if (plato) {
                                agregarPlato(plato);
                              }
                            }}
                          >
                            <Plus size={13} />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="ml-auto size-7 text-[#A3402A] hover:bg-[#FFF5F2]"
                            onClick={() =>
                              eliminarPlatoSeleccionado(item.plato_id)
                            }
                            title="Eliminar producto"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ==============================================
                  TOTAL
              =============================================== */}

              <div className="border-t border-[#E4DED3] px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6F695E]">
                    Total
                  </span>

                  <span className="font-mono text-lg font-semibold text-[#22201D]">
                    {money(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <DialogFooter className="border-t border-[#E4DED3] bg-white px-6 py-4">
            {mesaSeleccionada && estaOcupada(mesaSeleccionada.id) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void liberarMesa()}
                disabled={guardando}
                className="mr-auto text-[#A3402A] hover:bg-[#FFF5F2]"
              >
                <Trash2 size={15} />
                Liberar mesa
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={cerrarDialogo}
              disabled={guardando}
            >
              <X size={15} />
              Cerrar
            </Button>

            <Button
              type="button"
              onClick={() => void confirmarComanda()}
              disabled={guardando || itemsSeleccionados.length === 0}
              className="bg-[#22201D] text-white hover:bg-[#3A3732]"
            >
              {guardando ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check size={15} />
                  Confirmar comanda
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

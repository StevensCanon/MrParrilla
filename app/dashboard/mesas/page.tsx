"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
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
  Receipt,
} from "lucide-react";
import Image from "next/image";

import { supabase } from "@/lib/supabaseClient";

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

type RolUsuario = "admin" | "mesero" | "cajero";

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
  { value: "desayuno", label: "Desayunos" },
  { value: "almuerzo", label: "Almuerzos" },
  { value: "bebida", label: "Bebidas" },
  { value: "adicional", label: "Adicionales" },
];

const money = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(n) || 0));

export default function MesasPage() {
  const router = useRouter();

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [itemsComandas, setItemsComandas] = useState<ComandaItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [creandoMesa, setCreandoMesa] = useState(false);
  const [eliminandoMesa, setEliminandoMesa] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [rolUsuario, setRolUsuario] = useState<RolUsuario | null>(null);

  const esAdmin = rolUsuario === "admin";
  const esCajero = rolUsuario === "cajero";

  const [mesaSeleccionada, setMesaSeleccionada] =
    useState<Mesa | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  const [mesaDetalleCajero, setMesaDetalleCajero] =
    useState<Mesa | null>(null);
  const [dialogoDetalleCajero, setDialogoDetalleCajero] = useState(false);

  const [itemsSeleccionados, setItemsSeleccionados] = useState<
    ItemSeleccionado[]
  >([]);

  const [busqueda, setBusqueda] = useState("");

  const [dialogoCrearMesa, setDialogoCrearMesa] = useState(false);
  const [dialogoEditarMesa, setDialogoEditarMesa] = useState(false);

  const [mesaEditando, setMesaEditando] = useState<Mesa | null>(null);
  const [numeroMesa, setNumeroMesa] = useState("");

  const cargarRolUsuario = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRolUsuario(null);
        router.push("/login");
        return;
      }

      const { data: rol, error } = await supabase.rpc("rol_actual");

      if (error) {
        setRolUsuario(null);
        return;
      }

      const rolNormalizado = String(rol ?? "")
        .trim()
        .toLowerCase();

      if (
        rolNormalizado === "admin" ||
        rolNormalizado === "mesero" ||
        rolNormalizado === "cajero"
      ) {
        setRolUsuario(rolNormalizado);
      } else {
        setRolUsuario(null);
      }
    } catch {
      setRolUsuario(null);
    }
  }, [router]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      await cargarRolUsuario();

      const [
        { data: mesasData, error: mesasError },
        { data: platosData, error: platosError },
        { data: comandasData, error: comandasError },
      ] = await Promise.all([
        supabase
          .from("mesas")
          .select("id, nombre, activa")
          .eq("activa", true)
          .order("nombre", { ascending: true }),

        supabase
          .from("platos")
          .select("id, nombre, categoria, precio, disponible")
          .eq("disponible", true)
          .order("categoria", { ascending: true })
          .order("nombre", { ascending: true }),

        supabase
          .from("comandas")
          .select("id, mesa_id, mesero_id, estado")
          .eq("estado", "abierta")
          .not("mesa_id", "is", null),
      ]);

      if (mesasError) {
        setError(mesasError.message);
        return;
      }

      if (platosError) {
        setError(platosError.message);
        return;
      }

      if (comandasError) {
        setError(comandasError.message);
        return;
      }

      const comandasFinales = (comandasData as Comanda[]) ?? [];

      setMesas(
        ((mesasData as Mesa[]) ?? []).sort((a, b) =>
          a.nombre.localeCompare(b.nombre, undefined, {
            numeric: true,
          }),
        ),
      );

      setPlatos((platosData as Plato[]) ?? []);
      setComandas(comandasFinales);

      if (comandasFinales.length === 0) {
        setItemsComandas([]);
        return;
      }

      const idsComandas = comandasFinales.map((comanda) => comanda.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from("comanda_items")
        .select(
          "id, comanda_id, plato_id, cantidad, precio_unitario, estado, observaciones",
        )
        .in("comanda_id", idsComandas)
        .order("creado_en", { ascending: true });

      if (itemsError) {
        setError(itemsError.message);
        return;
      }

      setItemsComandas((itemsData as ComandaItem[]) ?? []);
    } catch {
      setError("No se pudo cargar la información de las mesas.");
    } finally {
      setLoading(false);
    }
  }, [router, cargarRolUsuario]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarDatos();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [cargarDatos]);

  const estaOcupada = useCallback(
    (mesaId: string) =>
      comandas.some(
        (comanda) =>
          comanda.mesa_id === mesaId && comanda.estado === "abierta",
      ),
    [comandas],
  );

  const obtenerComandaMesa = useCallback(
    (mesaId: string) =>
      comandas.find(
        (comanda) =>
          comanda.mesa_id === mesaId && comanda.estado === "abierta",
      ) ?? null,
    [comandas],
  );

  const obtenerItemsComanda = useCallback(
    (comandaId: string) =>
      itemsComandas.filter((item) => item.comanda_id === comandaId),
    [itemsComandas],
  );

  const obtenerTotalComanda = useCallback(
    (comandaId: string) =>
      obtenerItemsComanda(comandaId).reduce(
        (total, item) =>
          total +
          Number(item.precio_unitario) * Number(item.cantidad),
        0,
      ),
    [obtenerItemsComanda],
  );

  const obtenerTotalMesa = useCallback(
    (mesaId: string) => {
      const comanda = obtenerComandaMesa(mesaId);

      return comanda ? obtenerTotalComanda(comanda.id) : 0;
    },
    [obtenerComandaMesa, obtenerTotalComanda],
  );

  const platosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) {
      return platos;
    }

    return platos.filter((plato) =>
      plato.nombre.toLowerCase().includes(texto),
    );
  }, [platos, busqueda]);

  const platosPorCategoria = useMemo(
    () =>
      categorias.map((categoria) => ({
        ...categoria,
        platos: platosFiltrados.filter(
          (plato) => plato.categoria === categoria.value,
        ),
      })),
    [platosFiltrados],
  );

  const total = useMemo(
    () =>
      itemsSeleccionados.reduce(
        (acumulado, item) =>
          acumulado + item.precio * item.cantidad,
        0,
      ),
    [itemsSeleccionados],
  );

  const totalMesaCajero = useMemo(() => {
    if (!mesaDetalleCajero) {
      return 0;
    }

    return obtenerTotalMesa(mesaDetalleCajero.id);
  }, [mesaDetalleCajero, obtenerTotalMesa]);

  const cantidadPlato = useCallback(
    (platoId: string) =>
      itemsSeleccionados.find((item) => item.plato_id === platoId)
        ?.cantidad ?? 0,
    [itemsSeleccionados],
  );

  const cargarItemsComanda = async (comandaId: string) => {
    const { data, error: errorItems } = await supabase
      .from("comanda_items")
      .select(
        "id, comanda_id, plato_id, cantidad, precio_unitario, estado, observaciones",
      )
      .eq("comanda_id", comandaId)
      .order("creado_en", { ascending: true });

    if (errorItems) {
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

  const abrirDetalleCajero = (mesa: Mesa) => {
    if (!esCajero || !estaOcupada(mesa.id)) {
      return;
    }

    setError(null);
    setMesaDetalleCajero(mesa);
    setDialogoDetalleCajero(true);
  };

  const cerrarDetalleCajero = () => {
    setDialogoDetalleCajero(false);
    setMesaDetalleCajero(null);
  };

  const abrirMesa = async (mesa: Mesa) => {
    setError(null);

    if (esCajero) {
      abrirDetalleCajero(mesa);
      return;
    }

    setMesaSeleccionada(mesa);
    setBusqueda("");

    const comandaExistente = obtenerComandaMesa(mesa.id);

    if (!comandaExistente) {
      setItemsSeleccionados([]);
      setDialogoAbierto(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setGuardando(true);

      const items = await cargarItemsComanda(comandaExistente.id);

      setItemsSeleccionados(items);
      setDialogoAbierto(true);
    } catch {
      setError("No se pudo cargar la comanda de la mesa.");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarDialogo = () => {
    if (guardando) {
      return;
    }

    setDialogoAbierto(false);
    setMesaSeleccionada(null);
    setItemsSeleccionados([]);
    setBusqueda("");
  };

  const agregarPlato = (plato: Plato) => {
    setItemsSeleccionados((actuales) => {
      const existente = actuales.find(
        (item) => item.plato_id === plato.id,
      );

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

  const eliminarPlatoSeleccionado = (platoId: string) => {
    setItemsSeleccionados((actuales) =>
      actuales.filter((item) => item.plato_id !== platoId),
    );
  };

  const abrirCrearMesa = () => {
    setError(null);
    setNumeroMesa("");
    setDialogoCrearMesa(true);
  };

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
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

    setError(null);
    setCreandoMesa(true);

    try {
      const { data, error } = await supabase
        .from("mesas")
        .insert({
          nombre,
          activa: true,
        })
        .select("id, nombre, activa")
        .single();

      if (error) {
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
    } catch {
      setError("No se pudo crear la mesa.");
    } finally {
      setCreandoMesa(false);
    }
  };

  const abrirEditarMesa = (e: MouseEvent, mesa: Mesa) => {
    e.stopPropagation();

    if (!esAdmin) {
      return;
    }

    setError(null);

    const numero = mesa.nombre.replace(/^mesa\s*/i, "");

    setMesaEditando(mesa);
    setNumeroMesa(numero);
    setDialogoEditarMesa(true);
  };

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
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

    setGuardando(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("mesas")
        .update({ nombre })
        .eq("id", mesaEditando.id)
        .select("id, nombre, activa")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setMesas((actuales) =>
        actuales
          .map((mesa) =>
            mesa.id === mesaEditando.id ? (data as Mesa) : mesa,
          )
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
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo editar la mesa.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminarMesa = async (e: MouseEvent, mesa: Mesa) => {
    e.stopPropagation();

    if (!esAdmin) {
      return;
    }

    if (estaOcupada(mesa.id)) {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setEliminandoMesa(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("mesas")
        .delete()
        .eq("id", mesa.id);

      if (error) {
        throw new Error(error.message);
      }

      setMesas((actuales) =>
        actuales.filter((m) => m.id !== mesa.id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la mesa.",
      );
    } finally {
      setEliminandoMesa(false);
    }
  };

  const confirmarComanda = async () => {
    if (!mesaSeleccionada) {
      return;
    }

    if (itemsSeleccionados.length === 0) {
      setError("Agrega al menos un plato a la comanda.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setError(null);
    setGuardando(true);

    try {
      const usuarioId = user.id;

      let comanda = obtenerComandaMesa(mesaSeleccionada.id);

      if (!comanda) {
        const {
          data: nuevaComanda,
          error: errorComanda,
        } = await supabase
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
          if (errorComanda?.code === "23505") {
            await cargarDatos();

            throw new Error(
              "Esta mesa acaba de ser ocupada por otro mesero.",
            );
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

          await supabase
            .from("comandas")
            .delete()
            .eq("id", comanda.id);

          throw new Error(errorItems.message);
        }
      } else {
        const {
          data: itemsActualesData,
          error: errorItemsActuales,
        } = await supabase
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
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al confirmar la comanda.",
      );
    } finally {
      setGuardando(false);
    }
  };

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
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

      setComandas((actuales) =>
        actuales.filter((c) => c.id !== comanda.id),
      );

      setItemsComandas((actuales) =>
        actuales.filter((item) => item.comanda_id !== comanda.id),
      );

      cerrarDialogo();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo liberar la mesa.",
      );
    } finally {
      setGuardando(false);
    }
  };

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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl text-[#22201D]">Mesas</h1>

            {rolUsuario && (
              <span className="rounded-full bg-[#F1EEEA] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6F695E]">
                {rolUsuario}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-[#8A8375]">
            {esCajero
              ? "Consulta el consumo y total de las mesas ocupadas."
              : "Selecciona una mesa para crear o continuar una comanda."}
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
            const totalMesa = ocupada ? obtenerTotalMesa(mesa.id) : 0;
            const numero = mesa.nombre.replace(/^mesa\s*/i, "");

            return (
              <div
                key={mesa.id}
                className={`group relative flex min-h-[190px] flex-col items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  ocupada
                    ? "border-[#D8D0C3]"
                    : "border-[#E4DED3]"
                }`}
              >
                <span
                  className={`absolute right-2 top-2 z-10 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide shadow-sm ${
                    ocupada
                      ? "bg-red-800 text-white"
                      : "bg-green-700 text-white"
                  }`}
                >
                  {ocupada ? "Ocupada" : "Libre"}
                </span>

                <button
                  type="button"
                  onClick={() => void abrirMesa(mesa)}
                  className="relative mt-2 flex h-40 w-50 items-center justify-center"
                >
                  <Image
                    src="/mesa.png"
                    alt=""
                    fill
                    className="object-contain"
                  />

                  <span className="pointer-events-none relative pb-3 text-3xl font-semibold leading-none text-white">
                    {numero}
                  </span>

                  {esCajero && ocupada && (
                    <div className="pointer-events-none absolute w-[160px] rounded-lg border border-[#D8D0C3] bg-white px-4 py-3 text-left opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A8375]">
                        <Receipt size={13} />
                        Total mesa
                      </div>

                      <p className="mt-1 font-mono text-lg font-semibold text-[#22201D]">
                        {money(totalMesa)}
                      </p>

                      <p className="mt-1 text-[10px] text-[#8A8375]">
                        Haz clic para ver el detalle
                      </p>
                    </div>
                  )}
                </button>

                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#8A8375]">
                  Mesa {numero}
                </p>

                {esAdmin && (
                  <div className="mt-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => abrirEditarMesa(e, mesa)}
                      className="flex size-7 items-center justify-center rounded-md border border-zinc-400 bg-white text-[#6F695E] transition hover:bg-[#F5F2ED] hover:text-[#22201D]"
                      title="Editar mesa"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => void eliminarMesa(e, mesa)}
                      disabled={eliminandoMesa || ocupada}
                      className="flex size-7 items-center justify-center rounded-md border border-red-500 bg-white text-[#A3402A] transition hover:bg-[#FFF5F2] disabled:cursor-not-allowed disabled:opacity-40"
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
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogoCrearMesa}
        onOpenChange={setDialogoCrearMesa}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Nueva mesa</DialogTitle>

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

      <Dialog
        open={dialogoEditarMesa}
        onOpenChange={setDialogoEditarMesa}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Editar mesa</DialogTitle>

            <DialogDescription>
              Cambia el número de la mesa. El nombre se actualizará
              automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <label
              htmlFor="numeroMesaEditar"
              className="text-sm font-medium"
            >
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

      <Dialog
        open={dialogoDetalleCajero}
        onOpenChange={(open) => {
          if (!open) {
            cerrarDetalleCajero();
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[650px]">
          <DialogHeader className="border-b border-[#E4DED3] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">
                  Mesa{" "}
                  {mesaDetalleCajero?.nombre.replace(
                    /^mesa\s*/i,
                    "",
                  )}
                </DialogTitle>

                <DialogDescription className="mt-1">
                  Detalle del consumo actual.
                </DialogDescription>
              </div>

              <div className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-medium text-white">
                Ocupada
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {(() => {
              const comanda = mesaDetalleCajero
                ? obtenerComandaMesa(mesaDetalleCajero.id)
                : null;

              const items = comanda
                ? obtenerItemsComanda(comanda.id)
                : [];

              if (items.length === 0) {
                return (
                  <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                    <Receipt
                      size={32}
                      className="text-[#B8B1A4]"
                    />

                    <p className="mt-3 text-sm font-medium text-[#22201D]">
                      Sin productos
                    </p>

                    <p className="mt-1 text-xs text-[#8A8375]">
                      Esta mesa no tiene productos registrados.
                    </p>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-[#E4DED3] pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8A8375]">
                    <span>Producto</span>
                    <span>Cant.</span>
                    <span>Subtotal</span>
                  </div>

                  {items.map((item) => {
                    const plato = platos.find(
                      (p) => p.id === item.plato_id,
                    );

                    const nombre = plato?.nombre ?? "Producto";

                    const subtotal =
                      Number(item.precio_unitario) *
                      Number(item.cantidad);

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[#E4DED3] pb-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#22201D]">
                            {nombre}
                          </p>

                          <p className="mt-0.5 text-xs text-[#8A8375]">
                            {money(Number(item.precio_unitario))} c/u
                          </p>

                          {item.observaciones && (
                            <p className="mt-1 text-[11px] italic text-[#8A8375]">
                              {item.observaciones}
                            </p>
                          )}
                        </div>

                        <span className="text-sm font-medium text-[#6F695E]">
                          {item.cantidad}
                        </span>

                        <span className="whitespace-nowrap font-mono text-sm font-medium text-[#22201D]">
                          {money(subtotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="border-t border-[#E4DED3] bg-zinc-50 px-6 py-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-black">
                  Total de la mesa
                </p>

                <p className="mt-1 text-sm font-medium text-[#6F695E]">
                  Consumo actual
                </p>
              </div>

              <p className="font-mono text-2xl font-extrabold text-black">
                {money(totalMesaCajero)}
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-[#E4DED3] bg-white px-6 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={cerrarDetalleCajero}
              className="cursor-pointer bg-red-500 text-white hover:bg-red-900 hover:text-white"
            >
              <X size={15} />
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogoAbierto}
        onOpenChange={(open) => {
          if (!open) {
            cerrarDialogo();
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[950px]">
          <DialogHeader className="border-b border-[#E4DED3] px-6 py-5">
            <DialogTitle className="text-xl">
              Mesa{" "}
              {mesaSeleccionada?.nombre.replace(
                /^mesa\s*/i,
                "",
              )}
            </DialogTitle>

            <DialogDescription>
              {mesaSeleccionada &&
              estaOcupada(mesaSeleccionada.id)
                ? "Continúa agregando productos a la comanda."
                : "Selecciona los productos y confirma para enviar la comanda a cocina."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
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
                                      onClick={() =>
                                        quitarPlato(plato.id)
                                      }
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
                    <Search
                      size={28}
                      className="text-[#B8B1A4]"
                    />

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

            <div className="flex w-full flex-col border-t border-[#E4DED3] bg-[#FAF8F4] lg:w-[350px] lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between border-b border-[#E4DED3] px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#22201D]">
                    Comanda
                  </h3>

                  <p className="mt-0.5 text-xs text-[#8A8375]">
                    {itemsSeleccionados.length}{" "}
                    {itemsSeleccionados.length === 1
                      ? "producto"
                      : "productos"}
                  </p>
                </div>

                <Utensils
                  size={18}
                  className="text-[#8A8375]"
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {itemsSeleccionados.length === 0 ? (
                  <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                    <Utensils
                      size={26}
                      className="text-[#B8B1A4]"
                    />

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
                            onClick={() =>
                              quitarPlato(item.plato_id)
                            }
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
                              eliminarPlatoSeleccionado(
                                item.plato_id,
                              )
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

          <DialogFooter className="border-t border-[#E4DED3] bg-white px-6 py-4">
            {mesaSeleccionada &&
              estaOcupada(mesaSeleccionada.id) && (
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
              disabled={
                guardando || itemsSeleccionados.length === 0
              }
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
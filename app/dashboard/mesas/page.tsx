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

type RolUsuario = "admin" | "mesero" | "cajero" | "cocinero";

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
  item_padre_id: string | null;
  opcion_id: string | null;
  cantidad: number;
  precio_unitario: number;
  estado: string;
  observaciones: string | null;
  menu_opcion_id: string | null;
};

type OpcionMenu = {
  menu_opcion_id: string;
  opcion_id: string;
  nombre: string;
  recargo: number;
  agotado: boolean;
  orden: number;
};

type GrupoMenu = {
  id: string;
  grupo_id: string;
  nombre: string;
  obligatorio: boolean;
  orden: number;
  opciones: OpcionMenu[];
};

type ConfiguracionPlato = {
  menu_plato_id: string;
  plato_id: string;
  grupos: GrupoMenu[];
};

type OpcionSeleccionada = {
  menu_opcion_id: string;
  opcion_id: string;
  nombre: string;
  grupo_id: string;
  grupo_nombre: string;
  recargo: number;
};

type ItemSeleccionado = {
  uid: string;
  db_id?: string;
  plato_id: string;
  nombre: string;
  categoria: string;
  precio: number;
  cantidad: number;
  configurado: boolean;
  observaciones: string;
  opciones: OpcionSeleccionada[];
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

const esGrupoCaldosYSopas = (nombre: string) => {
  const nombreNormalizado = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return (
    nombreNormalizado.includes("caldos") && nombreNormalizado.includes("sopas")
  );
};

const generarUid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);

  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  const [mesaDetalleCajero, setMesaDetalleCajero] = useState<Mesa | null>(null);

  const [dialogoDetalleCajero, setDialogoDetalleCajero] = useState(false);

  const [itemsSeleccionados, setItemsSeleccionados] = useState<
    ItemSeleccionado[]
  >([]);

  const [busqueda, setBusqueda] = useState("");

  const [dialogoCrearMesa, setDialogoCrearMesa] = useState(false);
  const [dialogoEditarMesa, setDialogoEditarMesa] = useState(false);

  const [mesaEditando, setMesaEditando] = useState<Mesa | null>(null);
  const [numeroMesa, setNumeroMesa] = useState("");

  // ============================================================
  // ESTADO DEL CONFIGURADOR DE PLATOS
  // ============================================================

  const [dialogoArmarPlato, setDialogoArmarPlato] = useState(false);

  const [platoConfigurando, setPlatoConfigurando] = useState<Plato | null>(
    null,
  );

  const [configuracionPlato, setConfiguracionPlato] =
    useState<ConfiguracionPlato | null>(null);

  const [seleccionesConfiguracion, setSeleccionesConfiguracion] = useState<
    Record<string, OpcionSeleccionada[]>
  >({});

  const [observacionesConfiguracion, setObservacionesConfiguracion] =
    useState("");

  const [cargandoConfiguracion, setCargandoConfiguracion] = useState(false);

  // ============================================================
  // ROL
  // ============================================================

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
        rolNormalizado === "cocinero" ||
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

  // ============================================================
  // FECHA LOCAL COLOMBIA
  // ============================================================

  const obtenerFechaColombia = () => {
    const partes = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = partes.find((p) => p.type === "year")?.value;
    const month = partes.find((p) => p.type === "month")?.value;
    const day = partes.find((p) => p.type === "day")?.value;

    return `${year}-${month}-${day}`;
  };

  // ============================================================
  // CARGAR DATOS PRINCIPALES
  // ============================================================

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
          "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
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

  // ============================================================
  // HELPERS
  // ============================================================

  const estaOcupada = useCallback(
    (mesaId: string) =>
      comandas.some(
        (comanda) => comanda.mesa_id === mesaId && comanda.estado === "abierta",
      ),
    [comandas],
  );

  const obtenerComandaMesa = useCallback(
    (mesaId: string) =>
      comandas.find(
        (comanda) => comanda.mesa_id === mesaId && comanda.estado === "abierta",
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
      obtenerItemsComanda(comandaId)
        .filter((item) => item.item_padre_id === null)
        .reduce(
          (total, item) =>
            total + Number(item.precio_unitario) * Number(item.cantidad),
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

    return platos.filter((plato) => plato.nombre.toLowerCase().includes(texto));
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
        (acumulado, item) => acumulado + item.precio * item.cantidad,
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
      itemsSeleccionados
        .filter((item) => item.plato_id === platoId)
        .reduce((totalCantidad, item) => totalCantidad + item.cantidad, 0),
    [itemsSeleccionados],
  );

  // ============================================================
  // CARGAR OPCIONES DE UN PLATO DESDE EL MENÚ DEL DÍA
  // ============================================================

  const cargarConfiguracionPlato = async (
    plato: Plato,
  ): Promise<ConfiguracionPlato | null> => {
    const fechaActual = obtenerFechaColombia();

    // Buscar el menú activo del día en Colombia.
    const { data: menu, error: menuError } = await supabase
      .from("menus")
      .select("id, fecha, estado")
      .eq("fecha", fechaActual)
      .eq("estado", "activo")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (menuError) {
      throw new Error(menuError.message);
    }

    // No hay menú configurado para hoy.
    if (!menu) {
      return null;
    }

    // Buscar el plato dentro del menú.
    const { data: menuPlato, error: menuPlatoError } = await supabase
      .from("menu_platos")
      .select("id, menu_id, plato_id, activo")
      .eq("menu_id", menu.id)
      .eq("plato_id", plato.id)
      .eq("activo", true)
      .maybeSingle();

    if (menuPlatoError) {
      throw new Error(menuPlatoError.message);
    }

    if (!menuPlato) {
      return null;
    }

    // Grupos configurados para ese plato.
    const { data: gruposData, error: gruposError } = await supabase
      .from("menu_grupos")
      .select("id, menu_plato_id, grupo_id, activo, orden")
      .eq("menu_plato_id", menuPlato.id)
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (gruposError) {
      throw new Error(gruposError.message);
    }

    const grupos = gruposData ?? [];

    if (grupos.length === 0) {
      return null;
    }

    const grupoIds = grupos.map((grupo) => grupo.grupo_id);

    // Información base de los grupos.
    const { data: gruposBaseData, error: gruposBaseError } = await supabase
      .from("grupos_opcion")
      .select("id, nombre, obligatorio, orden")
      .in("id", grupoIds);

    if (gruposBaseError) {
      throw new Error(gruposBaseError.message);
    }

    const gruposBase = gruposBaseData ?? [];

    const gruposBaseMap = new Map(gruposBase.map((grupo) => [grupo.id, grupo]));

    // Opciones que realmente fueron incluidas en el menú de hoy.
    const menuGrupoIds = grupos.map((grupo) => grupo.id);

    const { data: menuOpcionesData, error: menuOpcionesError } = await supabase
      .from("menu_opciones")
      .select("id, menu_grupo_id, opcion_id, activo, orden, agotado")
      .in("menu_grupo_id", menuGrupoIds)
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (menuOpcionesError) {
      throw new Error(menuOpcionesError.message);
    }

    const menuOpciones = menuOpcionesData ?? [];

    if (menuOpciones.length === 0) {
      return {
        menu_plato_id: menuPlato.id,
        plato_id: plato.id,
        grupos: grupos.map((grupo) => {
          const grupoBase = gruposBaseMap.get(grupo.grupo_id);

          const esCaldosYSopas = esGrupoCaldosYSopas(grupoBase?.nombre ?? "");

          return {
            id: grupo.id,
            grupo_id: grupo.grupo_id,
            nombre: grupoBase?.nombre ?? "Grupo",
            obligatorio: esCaldosYSopas
              ? false
              : Boolean(grupoBase?.obligatorio),
            orden: Number(grupo.orden ?? grupoBase?.orden ?? 0),
            opciones: [],
          };
        }),
      };
    }

    const opcionIds = menuOpciones.map((menuOpcion) => menuOpcion.opcion_id);

    const { data: opcionesData, error: opcionesError } = await supabase
      .from("opciones_grupo")
      .select("id, nombre, recargo")
      .in("id", opcionIds);

    if (opcionesError) {
      throw new Error(opcionesError.message);
    }

    const opcionesMap = new Map(
      (opcionesData ?? []).map((opcion) => [opcion.id, opcion]),
    );

    const configuracion: ConfiguracionPlato = {
      menu_plato_id: menuPlato.id,
      plato_id: plato.id,
      grupos: grupos.map((grupo) => {
        const grupoBase = gruposBaseMap.get(grupo.grupo_id);

        const esCaldosYSopas = esGrupoCaldosYSopas(grupoBase?.nombre ?? "");

        return {
          id: grupo.id,
          grupo_id: grupo.grupo_id,
          nombre: grupoBase?.nombre ?? "Grupo",
          obligatorio: esCaldosYSopas ? false : Boolean(grupoBase?.obligatorio),
          orden: Number(grupo.orden ?? grupoBase?.orden ?? 0),
          opciones: menuOpciones
            .filter((menuOpcion) => menuOpcion.menu_grupo_id === grupo.id)
            .map((menuOpcion) => {
              const opcion = opcionesMap.get(menuOpcion.opcion_id);

              return {
                menu_opcion_id: menuOpcion.id,
                opcion_id: menuOpcion.opcion_id,
                nombre: opcion?.nombre ?? "Opción",
                recargo: Number(opcion?.recargo ?? 0),
                agotado: Boolean(menuOpcion.agotado),
                orden: Number(menuOpcion.orden ?? 0),
              };
            }),
        };
      }),
    };

    return configuracion;
  };

  // ============================================================
  // ABRIR CONFIGURADOR
  // ============================================================

  const abrirConfiguradorPlato = async (plato: Plato) => {
    setError(null);
    setCargandoConfiguracion(true);
    setPlatoConfigurando(plato);
    setConfiguracionPlato(null);
    setSeleccionesConfiguracion({});
    setObservacionesConfiguracion("");
    setDialogoArmarPlato(true);

    try {
      const configuracion = await cargarConfiguracionPlato(plato);

      if (!configuracion) {
        setDialogoArmarPlato(false);
        setPlatoConfigurando(null);

        // Si no tiene configuración de menú,
        // se comporta como un plato normal.
        agregarPlatoDirecto(plato);

        return;
      }

      setConfiguracionPlato(configuracion);
    } catch (err) {
      setDialogoArmarPlato(false);
      setPlatoConfigurando(null);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la configuración del plato.",
      );
    } finally {
      setCargandoConfiguracion(false);
    }
  };

  // ============================================================
  // AGREGAR PLATO NORMAL
  // ============================================================

  const agregarPlatoDirecto = (plato: Plato) => {
    setItemsSeleccionados((actuales) => {
      const existente = actuales.find(
        (item) => item.plato_id === plato.id && !item.configurado,
      );

      if (existente) {
        return actuales.map((item) =>
          item.uid === existente.uid
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
          uid: generarUid(),
          plato_id: plato.id,
          nombre: plato.nombre,
          categoria: plato.categoria,
          precio: Number(plato.precio),
          cantidad: 1,
          configurado: false,
          observaciones: "",
          opciones: [],
        },
      ];
    });
  };

  // ============================================================
  // AGREGAR PLATO
  // ============================================================

  const agregarPlato = async (plato: Plato) => {
    await abrirConfiguradorPlato(plato);
  };

  // ============================================================
  // SELECCIONAR OPCIÓN DEL CONFIGURADOR
  // ============================================================

  const seleccionarOpcion = (grupo: GrupoMenu, opcion: OpcionMenu) => {
    if (opcion.agotado) {
      return;
    }

    setSeleccionesConfiguracion((actuales) => {
      const seleccionadas = actuales[grupo.id] ?? [];

      const yaSeleccionada = seleccionadas.some(
        (item) => item.menu_opcion_id === opcion.menu_opcion_id,
      );

      if (yaSeleccionada) {
        return {
          ...actuales,
          [grupo.id]: seleccionadas.filter(
            (item) => item.menu_opcion_id !== opcion.menu_opcion_id,
          ),
        };
      }

      return {
        ...actuales,
        [grupo.id]: [
          ...seleccionadas,
          {
            menu_opcion_id: opcion.menu_opcion_id,
            opcion_id: opcion.opcion_id,
            nombre: opcion.nombre,
            grupo_id: grupo.id,
            grupo_nombre: grupo.nombre,
            recargo: opcion.recargo,
          },
        ],
      };
    });
  };

  // ============================================================
  // PRECIO DEL PLATO QUE SE ESTÁ ARMANDO
  // ============================================================

  const precioConfigurando = useMemo(() => {
    if (!platoConfigurando) {
      return 0;
    }

    const recargos = Object.values(seleccionesConfiguracion)
      .flat()
      .reduce(
        (totalRecargos, opcion) => totalRecargos + Number(opcion.recargo || 0),
        0,
      );

    return Number(platoConfigurando.precio) + recargos;
  }, [platoConfigurando, seleccionesConfiguracion]);

  // ============================================================
  // CONFIRMAR CONFIGURACIÓN DEL PLATO
  // ============================================================

  const confirmarConfiguracionPlato = () => {
    if (!platoConfigurando || !configuracionPlato) {
      return;
    }

    setError(null);

    for (const grupo of configuracionPlato.grupos) {
      // Cald os y Sopas nunca obliga a seleccionar una opción.
      if (esGrupoCaldosYSopas(grupo.nombre)) {
        continue;
      }

      if (!grupo.obligatorio) {
        continue;
      }

      const opcionesDisponibles = grupo.opciones.filter(
        (opcion) => !opcion.agotado,
      );

      const seleccionadas = seleccionesConfiguracion[grupo.id] ?? [];

      if (opcionesDisponibles.length > 0 && seleccionadas.length === 0) {
        setError(
          `Selecciona al menos una opción en "${grupo.nombre}" para "${platoConfigurando.nombre}".`,
        );
        return;
      }

      if (opcionesDisponibles.length === 0 && grupo.opciones.length > 0) {
        setError(`No hay opciones disponibles para "${grupo.nombre}".`);
        return;
      }
    }

    const opciones = Object.values(seleccionesConfiguracion).flat();

    const nuevoItem: ItemSeleccionado = {
      uid: generarUid(),
      plato_id: platoConfigurando.id,
      nombre: platoConfigurando.nombre,
      categoria: platoConfigurando.categoria,
      precio: precioConfigurando,
      cantidad: 1,
      configurado: true,
      observaciones: observacionesConfiguracion.trim(),
      opciones,
    };

    setItemsSeleccionados((actuales) => [...actuales, nuevoItem]);

    setDialogoArmarPlato(false);
    setPlatoConfigurando(null);
    setConfiguracionPlato(null);
    setSeleccionesConfiguracion({});
    setObservacionesConfiguracion("");
  };

  const cerrarConfiguradorPlato = () => {
    if (cargandoConfiguracion || guardando) {
      return;
    }

    setDialogoArmarPlato(false);
    setPlatoConfigurando(null);
    setConfiguracionPlato(null);
    setSeleccionesConfiguracion({});
    setObservacionesConfiguracion("");
  };

  // ============================================================
  // CANTIDADES
  // ============================================================

  const quitarPlato = (platoId: string) => {
    setItemsSeleccionados((actuales) => {
      const indices = actuales
        .map((item, index) => (item.plato_id === platoId ? index : -1))
        .filter((index) => index >= 0);

      if (indices.length === 0) {
        return actuales;
      }

      const ultimoIndice = indices[indices.length - 1];

      return actuales
        .map((item, index) =>
          index === ultimoIndice
            ? {
                ...item,
                cantidad: item.cantidad - 1,
              }
            : item,
        )
        .filter((item) => item.cantidad > 0);
    });
  };

  const incrementarItem = (uid: string) => {
    setItemsSeleccionados((actuales) =>
      actuales.map((item) =>
        item.uid === uid
          ? {
              ...item,
              cantidad: item.cantidad + 1,
            }
          : item,
      ),
    );
  };

  const disminuirItem = (uid: string) => {
    setItemsSeleccionados((actuales) =>
      actuales
        .map((item) =>
          item.uid === uid
            ? {
                ...item,
                cantidad: item.cantidad - 1,
              }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    );
  };

  const eliminarPlatoSeleccionado = (uid: string) => {
    setItemsSeleccionados((actuales) =>
      actuales.filter((item) => item.uid !== uid),
    );
  };

  // ============================================================
  // CARGAR ITEMS DE UNA COMANDA EXISTENTE
  // ============================================================

  const cargarItemsComanda = async (
    comandaId: string,
  ): Promise<ItemSeleccionado[]> => {
    const { data, error: errorItems } = await supabase
      .from("comanda_items")
      .select(
        "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
      )
      .eq("comanda_id", comandaId)
      .order("creado_en", { ascending: true });

    if (errorItems) {
      throw new Error(errorItems.message);
    }

    const items = (data as ComandaItem[]) ?? [];

    const padres = items.filter((item) => item.item_padre_id === null);

    const hijos = items.filter((item) => item.item_padre_id !== null);

    const opcionIds = hijos
      .map((item) => item.opcion_id)
      .filter((id): id is string => Boolean(id));

    const menuOpcionIds = hijos
      .map((item) => item.menu_opcion_id)
      .filter((id): id is string => Boolean(id));

    const [{ data: opcionesData }, { data: menuOpcionesData }] =
      await Promise.all([
        opcionIds.length > 0
          ? supabase
              .from("opciones_grupo")
              .select("id, nombre, recargo")
              .in("id", opcionIds)
          : Promise.resolve({ data: [] }),

        menuOpcionIds.length > 0
          ? supabase
              .from("menu_opciones")
              .select("id, menu_grupo_id")
              .in("id", menuOpcionIds)
          : Promise.resolve({ data: [] }),
      ]);

    const menuGrupoIds = (menuOpcionesData ?? []).map(
      (item) => item.menu_grupo_id,
    );

    const { data: menuGruposData } =
      menuGrupoIds.length > 0
        ? await supabase
            .from("menu_grupos")
            .select("id, grupo_id")
            .in("id", menuGrupoIds)
        : { data: [] };

    const grupoIds = (menuGruposData ?? []).map((item) => item.grupo_id);

    const { data: gruposData } =
      grupoIds.length > 0
        ? await supabase
            .from("grupos_opcion")
            .select("id, nombre")
            .in("id", grupoIds)
        : { data: [] };

    const opcionesMap = new Map(
      (opcionesData ?? []).map((opcion) => [opcion.id, opcion]),
    );

    const menuOpcionesMap = new Map(
      (menuOpcionesData ?? []).map((item) => [item.id, item]),
    );

    const menuGruposMap = new Map(
      (menuGruposData ?? []).map((item) => [item.id, item]),
    );

    const gruposMap = new Map(
      (gruposData ?? []).map((grupo) => [grupo.id, grupo]),
    );

    return padres.map((item) => {
      const plato = platos.find((p) => p.id === item.plato_id);

      const hijosDelItem = hijos.filter(
        (hijo) => hijo.item_padre_id === item.id,
      );

      const opciones: OpcionSeleccionada[] = hijosDelItem
        .map((hijo) => {
          if (!hijo.opcion_id) {
            return null;
          }

          const opcion = opcionesMap.get(hijo.opcion_id);

          const menuOpcion = hijo.menu_opcion_id
            ? menuOpcionesMap.get(hijo.menu_opcion_id)
            : undefined;

          const menuGrupo = menuOpcion?.menu_grupo_id
            ? menuGruposMap.get(menuOpcion.menu_grupo_id)
            : undefined;

          const grupo = menuGrupo?.grupo_id
            ? gruposMap.get(menuGrupo.grupo_id)
            : undefined;

          return {
            menu_opcion_id: hijo.menu_opcion_id ?? "",
            opcion_id: hijo.opcion_id,
            nombre: opcion?.nombre ?? "Opción",
            grupo_id: grupo?.id ?? "",
            grupo_nombre: grupo?.nombre ?? "Grupo",
            recargo: Number(opcion?.recargo ?? 0),
          };
        })
        .filter((opcion): opcion is OpcionSeleccionada => opcion !== null);

      return {
        uid: generarUid(),
        db_id: item.id,
        plato_id: item.plato_id,
        nombre: plato?.nombre ?? "Plato",
        categoria: plato?.categoria ?? "",
        precio: Number(item.precio_unitario),
        cantidad: item.cantidad,
        configurado: opciones.length > 0,
        observaciones: item.observaciones ?? "",
        opciones,
      };
    });
  };

  // ============================================================
  // CAJERO
  // ============================================================

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

  // ============================================================
  // ABRIR MESA
  // ============================================================

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

  // ============================================================
  // CREAR MESA
  // ============================================================

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

  // ============================================================
  // EDITAR MESA
  // ============================================================

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
      const { error } = await supabase.from("mesas").delete().eq("id", mesa.id);

      if (error) {
        throw new Error(error.message);
      }

      setMesas((actuales) => actuales.filter((m) => m.id !== mesa.id));
    } catch (err) {
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

      // ========================================================
      // CREAR NUEVA COMANDA
      // ========================================================

      if (!comanda) {
        const { data: nuevaComanda, error: errorComanda } = await supabase
          .from("comandas")
          .insert({
            canal: "restaurante",
            mesa_id: mesaSeleccionada.id,
            mesero_id: usuarioId,
            estado: "abierta",
          })
          .select("id, mesa_id, mesero_id, estado")
          .single();

        if (errorComanda || !nuevaComanda) {
          if (errorComanda?.code === "23505") {
            await cargarDatos();

            throw new Error("Esta mesa acaba de ser ocupada por otro mesero.");
          }

          throw new Error(
            errorComanda?.message ?? "No se pudo crear la comanda.",
          );
        }

        comanda = nuevaComanda as Comanda;

        // ------------------------------------------------------
        // INSERTAR PADRES
        // ------------------------------------------------------

        const padresParaInsertar = itemsSeleccionados.map((item) => ({
          comanda_id: comanda!.id,
          plato_id: item.plato_id,
          item_padre_id: null,
          opcion_id: null,
          menu_opcion_id: null,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          estado: "pendiente",
          observaciones: item.observaciones.trim() || null,
        }));

        const { data: padresInsertados, error: errorPadres } = await supabase
          .from("comanda_items")
          .insert(padresParaInsertar)
          .select(
            "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
          );

        if (errorPadres || !padresInsertados) {
          await supabase.from("comandas").delete().eq("id", comanda.id);

          throw new Error(
            errorPadres?.message ?? "No se pudieron guardar los productos.",
          );
        }

        // ------------------------------------------------------
        // INSERTAR OPCIONES HIJAS
        // ------------------------------------------------------

        const opcionesParaInsertar: Array<{
          comanda_id: string;
          plato_id: string;
          item_padre_id: string;
          opcion_id: string;
          menu_opcion_id: string;
          cantidad: number;
          precio_unitario: number;
          estado: string;
          observaciones: null;
        }> = [];

        itemsSeleccionados.forEach((item, index) => {
          const padre = padresInsertados[index];

          if (!padre || !item.configurado) {
            return;
          }

          item.opciones.forEach((opcion) => {
            opcionesParaInsertar.push({
              comanda_id: comanda!.id,
              plato_id: item.plato_id,
              item_padre_id: padre.id,
              opcion_id: opcion.opcion_id,
              menu_opcion_id: opcion.menu_opcion_id,
              cantidad: item.cantidad,
              precio_unitario: 0,
              estado: "pendiente",
              observaciones: null,
            });
          });
        });

        if (opcionesParaInsertar.length > 0) {
          const { error: errorOpciones } = await supabase
            .from("comanda_items")
            .insert(opcionesParaInsertar);

          if (errorOpciones) {
            await supabase
              .from("comanda_items")
              .delete()
              .eq("comanda_id", comanda.id);

            await supabase.from("comandas").delete().eq("id", comanda.id);

            throw new Error(errorOpciones.message);
          }
        }
      } else {
        // ======================================================
        // ACTUALIZAR COMANDA EXISTENTE
        // ======================================================

        const { data: itemsActualesData, error: errorItemsActuales } =
          await supabase
            .from("comanda_items")
            .select(
              "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
            )
            .eq("comanda_id", comanda.id)
            .order("creado_en", { ascending: true });

        if (errorItemsActuales) {
          throw new Error(errorItemsActuales.message);
        }

        const itemsActuales = (itemsActualesData as ComandaItem[]) ?? [];

        const padresActuales = itemsActuales.filter(
          (item) => item.item_padre_id === null,
        );

        const hijosActuales = itemsActuales.filter(
          (item) => item.item_padre_id !== null,
        );

        // ------------------------------------------------------
        // BORRAR PADRES QUE YA NO EXISTEN
        // ------------------------------------------------------

        const idsSeleccionadosExistentes = new Set(
          itemsSeleccionados
            .map((item) => item.db_id)
            .filter((id): id is string => Boolean(id)),
        );

        for (const padreActual of padresActuales) {
          if (!idsSeleccionadosExistentes.has(padreActual.id)) {
            // Primero eliminamos hijos.
            const { error: errorDeleteHijos } = await supabase
              .from("comanda_items")
              .delete()
              .eq("item_padre_id", padreActual.id);

            if (errorDeleteHijos) {
              throw new Error(errorDeleteHijos.message);
            }

            const { error: errorDeletePadre } = await supabase
              .from("comanda_items")
              .delete()
              .eq("id", padreActual.id);

            if (errorDeletePadre) {
              throw new Error(errorDeletePadre.message);
            }
          }
        }

        // ------------------------------------------------------
        // ACTUALIZAR / INSERTAR
        // ------------------------------------------------------

        for (const itemSeleccionado of itemsSeleccionados) {
          // ----------------------------------------------------
          // ITEM EXISTENTE
          // ----------------------------------------------------

          if (itemSeleccionado.db_id) {
            const padreActual = padresActuales.find(
              (item) => item.id === itemSeleccionado.db_id,
            );

            if (!padreActual) {
              continue;
            }

            const precioCambio =
              Number(padreActual.precio_unitario) !==
              Number(itemSeleccionado.precio);

            const cantidadCambio =
              Number(padreActual.cantidad) !==
              Number(itemSeleccionado.cantidad);

            const observacionesActuales =
              padreActual.observaciones?.trim() ?? "";

            const observacionesNuevas = itemSeleccionado.observaciones.trim();

            const observacionesCambio =
              observacionesActuales !== observacionesNuevas;

            if (precioCambio || cantidadCambio || observacionesCambio) {
              const { error: errorUpdate } = await supabase
                .from("comanda_items")
                .update({
                  cantidad: itemSeleccionado.cantidad,
                  precio_unitario: itemSeleccionado.precio,
                  observaciones: observacionesNuevas || null,
                })
                .eq("id", padreActual.id);

              if (errorUpdate) {
                throw new Error(errorUpdate.message);
              }
            }

            // --------------------------------------------------
            // SINCRONIZAR OPCIONES
            // --------------------------------------------------

            if (itemSeleccionado.configurado) {
              const hijosDelPadre = hijosActuales.filter(
                (hijo) => hijo.item_padre_id === padreActual.id,
              );

              const opcionesActuales = new Set(
                hijosDelPadre.map(
                  (hijo) => `${hijo.opcion_id}|${hijo.menu_opcion_id}`,
                ),
              );

              const opcionesNuevas = new Set(
                itemSeleccionado.opciones.map(
                  (opcion) => `${opcion.opcion_id}|${opcion.menu_opcion_id}`,
                ),
              );

              const opcionesCambiar =
                opcionesActuales.size !== opcionesNuevas.size ||
                [...opcionesActuales].some(
                  (opcion) => !opcionesNuevas.has(opcion),
                );

              if (opcionesCambiar) {
                const { error: errorDeleteOpciones } = await supabase
                  .from("comanda_items")
                  .delete()
                  .eq("item_padre_id", padreActual.id);

                if (errorDeleteOpciones) {
                  throw new Error(errorDeleteOpciones.message);
                }

                const nuevasOpciones = itemSeleccionado.opciones.map(
                  (opcion) => ({
                    comanda_id: comanda!.id,
                    plato_id: itemSeleccionado.plato_id,
                    item_padre_id: padreActual.id,
                    opcion_id: opcion.opcion_id,
                    menu_opcion_id: opcion.menu_opcion_id,
                    cantidad: itemSeleccionado.cantidad,
                    precio_unitario: 0,
                    estado: "pendiente",
                    observaciones: null,
                  }),
                );

                if (nuevasOpciones.length > 0) {
                  const { error: errorInsertOpciones } = await supabase
                    .from("comanda_items")
                    .insert(nuevasOpciones);

                  if (errorInsertOpciones) {
                    throw new Error(errorInsertOpciones.message);
                  }
                }
              } else if (cantidadCambio) {
                // Si las opciones son las mismas,
                // solo actualizamos sus cantidades.
                for (const hijo of hijosDelPadre) {
                  const { error: errorUpdateHijo } = await supabase
                    .from("comanda_items")
                    .update({
                      cantidad: itemSeleccionado.cantidad,
                    })
                    .eq("id", hijo.id);

                  if (errorUpdateHijo) {
                    throw new Error(errorUpdateHijo.message);
                  }
                }
              }
            }

            continue;
          }

          // ----------------------------------------------------
          // ITEM NUEVO
          // ----------------------------------------------------

          const { data: nuevoPadre, error: errorNuevoPadre } = await supabase
            .from("comanda_items")
            .insert({
              comanda_id: comanda.id,
              plato_id: itemSeleccionado.plato_id,
              item_padre_id: null,
              opcion_id: null,
              menu_opcion_id: null,
              cantidad: itemSeleccionado.cantidad,
              precio_unitario: itemSeleccionado.precio,
              estado: "pendiente",
              observaciones: itemSeleccionado.observaciones.trim() || null,
            })
            .select(
              "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
            )
            .single();

          if (errorNuevoPadre || !nuevoPadre) {
            throw new Error(
              errorNuevoPadre?.message ??
                "No se pudo agregar el nuevo producto.",
            );
          }

          if (
            itemSeleccionado.configurado &&
            itemSeleccionado.opciones.length > 0
          ) {
            const opcionesNuevas = itemSeleccionado.opciones.map((opcion) => ({
              comanda_id: comanda!.id,
              plato_id: itemSeleccionado.plato_id,
              item_padre_id: nuevoPadre.id,
              opcion_id: opcion.opcion_id,
              menu_opcion_id: opcion.menu_opcion_id,
              cantidad: itemSeleccionado.cantidad,
              precio_unitario: 0,
              estado: "pendiente",
              observaciones: null,
            }));

            const { error: errorNuevasOpciones } = await supabase
              .from("comanda_items")
              .insert(opcionesNuevas);

            if (errorNuevasOpciones) {
              throw new Error(errorNuevasOpciones.message);
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

      setComandas((actuales) => actuales.filter((c) => c.id !== comanda.id));

      setItemsComandas((actuales) =>
        actuales.filter((item) => item.comanda_id !== comanda.id),
      );

      cerrarDialogo();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo liberar la mesa.",
      );
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // RENDER
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl text-[#22201D]">Mesas</h1>
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
            className="cursor-pointer bg-[#22201D] text-white hover:bg-[#3A3732]"
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
          ESTADOS
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
            const totalMesa = ocupada ? obtenerTotalMesa(mesa.id) : 0;

            const numero = mesa.nombre.replace(/^mesa\s*/i, "");

            return (
              <div
                key={mesa.id}
                className={`group relative flex min-h-[190px] flex-col items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  ocupada ? "border-[#D8D0C3]" : "border-[#E4DED3]"
                }`}
              >
                <span
                  className={`absolute right-2 top-2 rounded-full px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide shadow-sm ${
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

      {/* ======================================================
          MODAL CREAR MESA
      ====================================================== */}

      <Dialog open={dialogoCrearMesa} onOpenChange={setDialogoCrearMesa}>
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

      {/* ======================================================
          MODAL EDITAR MESA
      ====================================================== */}

      <Dialog open={dialogoEditarMesa} onOpenChange={setDialogoEditarMesa}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Editar mesa</DialogTitle>

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
          MODAL DETALLE CAJERO
      ====================================================== */}

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
                  Mesa {mesaDetalleCajero?.nombre.replace(/^mesa\s*/i, "")}
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
                ? obtenerItemsComanda(comanda.id).filter(
                    (item) => item.item_padre_id === null,
                  )
                : [];

              if (items.length === 0) {
                return (
                  <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                    <Receipt size={32} className="text-[#B8B1A4]" />

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
                    const plato = platos.find((p) => p.id === item.plato_id);

                    const nombre = plato?.nombre ?? "Producto";

                    const subtotal =
                      Number(item.precio_unitario) * Number(item.cantidad);

                    const hijos = obtenerItemsComanda(comanda!.id).filter(
                      (hijo) => hijo.item_padre_id === item.id,
                    );

                    return (
                      <div
                        key={item.id}
                        className="border-b border-[#E4DED3] pb-3"
                      >
                        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#22201D]">
                              {nombre}
                            </p>

                            <p className="mt-0.5 text-xs text-[#8A8375]">
                              {money(Number(item.precio_unitario))} c/u
                            </p>

                            {item.observaciones && (
                              <div className="mt-2 rounded-md border border-[#E4DED3] bg-[#FFFDF9] px-3 py-2">
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8A8375]">
                                  Observaciones
                                </p>

                                <p className="mt-1 text-[11px] text-[#4F4A43]">
                                  {item.observaciones}
                                </p>
                              </div>
                            )}
                          </div>

                          <span className="text-sm font-medium text-[#6F695E]">
                            {item.cantidad}
                          </span>

                          <span className="whitespace-nowrap font-mono text-sm font-medium text-[#22201D]">
                            {money(subtotal)}
                          </span>
                        </div>

                        {hijos.length > 0 && (
                          <div className="mt-2 rounded-md bg-[#F5F2ED] px-3 py-2">
                            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[#8A8375]">
                              Selección
                            </p>

                            <div className="flex flex-col gap-1">
                              {hijos.map((hijo) => (
                                <span
                                  key={hijo.id}
                                  className="text-xs text-[#4F4A43]"
                                >
                                  {hijo.opcion_id
                                    ? "• Opción seleccionada"
                                    : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
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

      {/* ======================================================
          MODAL PRINCIPAL COMANDA
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
          <DialogHeader className="border-b border-[#E4DED3] px-6 py-5">
            <DialogTitle className="text-xl">
              Mesa {mesaSeleccionada?.nombre.replace(/^mesa\s*/i, "")}
            </DialogTitle>

            <DialogDescription>
              {mesaSeleccionada && estaOcupada(mesaSeleccionada.id)
                ? "Continúa agregando productos a la comanda."
                : "Selecciona los productos y confirma para enviar la comanda a cocina."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* ==================================================
                PRODUCTOS
            ================================================== */}

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
                                  onClick={() => void agregarPlato(plato)}
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

            {/* ==================================================
                COMANDA
            ================================================== */}

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
                        key={item.uid}
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

                        {/* ----------------------------------
                              OPCIONES CONFIGURADAS
                          ----------------------------------- */}

                        {item.configurado && item.opciones.length > 0 && (
                          <div className="mt-2 rounded-md bg-white px-3 py-2">
                            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[#8A8375]">
                              Selección
                            </p>

                            <div className="flex flex-col gap-0.5">
                              {item.opciones.map((opcion) => (
                                <div
                                  key={`${item.uid}-${opcion.menu_opcion_id}`}
                                  className="flex items-center justify-between gap-2 text-xs"
                                >
                                  <span className="text-[#4F4A43]">
                                    {opcion.grupo_nombre}:{" "}
                                    <strong>{opcion.nombre}</strong>
                                  </span>

                                  {opcion.recargo > 0 && (
                                    <span className="font-mono text-[10px] text-[#8A8375]">
                                      +{money(opcion.recargo)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ----------------------------------
                              OBSERVACIONES
                          ----------------------------------- */}

                        {item.observaciones.trim() && (
                          <div className="mt-2 rounded-md border border-[#E4DED3] bg-[#FFFDF9] px-3 py-2">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#8A8375]">
                              Observaciones
                            </p>

                            <p className="mt-1 text-xs text-[#4F4A43]">
                              {item.observaciones}
                            </p>
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7"
                            onClick={() => disminuirItem(item.uid)}
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
                            onClick={() => incrementarItem(item.uid)}
                          >
                            <Plus size={13} />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="ml-auto size-7 text-[#A3402A] hover:bg-[#FFF5F2]"
                            onClick={() => eliminarPlatoSeleccionado(item.uid)}
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

          <DialogFooter className="border-t border-[#E4DED3] bg-white px-6">
            {mesaSeleccionada && estaOcupada(mesaSeleccionada.id) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void liberarMesa()}
                disabled={guardando}
                className="mr-auto mb-4 cursor-pointer text-[#A3402A] hover:bg-red-500 hover:text-white"
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
              className="cursor-pointer"
            >
              <X size={15} />
              Cerrar
            </Button>

            <Button
              type="button"
              onClick={() => void confirmarComanda()}
              disabled={guardando || itemsSeleccionados.length === 0}
              className="cursor-pointer bg-[#22201D] text-white hover:bg-[#3A3732]"
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

      {/* ======================================================
          MODAL ARMAR PLATO
      ====================================================== */}

      <Dialog
        open={dialogoArmarPlato}
        onOpenChange={(open) => {
          if (!open) {
            cerrarConfiguradorPlato();
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[650px]">
          <DialogHeader className="border-b border-[#E4DED3] px-6 py-5">
            <DialogTitle className="text-xl">
              Armar {platoConfigurando?.nombre ?? "plato"}
            </DialogTitle>

            <DialogDescription>
              Selecciona las opciones que tendrá este plato.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {cargandoConfiguracion ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[#8A8375]" />

                <p className="mt-3 text-sm font-medium text-[#22201D]">
                  Cargando opciones...
                </p>

                <p className="mt-1 text-xs text-[#8A8375]">
                  Consultando el menú del día.
                </p>
              </div>
            ) : !configuracionPlato ? (
              <div className="flex min-h-[250px] items-center justify-center text-sm text-[#8A8375]">
                No hay configuración disponible.
              </div>
            ) : (
              <div className="flex flex-col gap-7">
                {configuracionPlato.grupos.map((grupo) => {
                  const selecciones = seleccionesConfiguracion[grupo.id] ?? [];

                  const opcionesDisponibles = grupo.opciones.filter(
                    (opcion) => !opcion.agotado,
                  );

                  return (
                    <section key={grupo.id}>
                      <div className="mb-3 flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#22201D]">
                          {grupo.nombre}
                        </h3>

                        {grupo.obligatorio ? (
                          <span className="rounded-full bg-[#F1EEEA] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#6F695E]">
                            Obligatorio
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#F5F2ED] px-2 py-0.5 text-[9px] font-medium text-[#8A8375]">
                            Opcional
                          </span>
                        )}
                      </div>

                      {grupo.opciones.length === 0 ? (
                        <div className="rounded-md border border-[#E4DED3] bg-[#FAF8F4] px-4 py-3 text-xs text-[#8A8375]">
                          No hay opciones configuradas.
                        </div>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {grupo.opciones.map((opcion) => {
                            const seleccionada = selecciones.some(
                              (seleccion) =>
                                seleccion.menu_opcion_id ===
                                opcion.menu_opcion_id,
                            );

                            return (
                              <button
                                key={opcion.menu_opcion_id}
                                type="button"
                                disabled={opcion.agotado}
                                onClick={() => seleccionarOpcion(grupo, opcion)}
                                className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition ${
                                  opcion.agotado
                                    ? "cursor-not-allowed border-[#E4DED3] bg-[#F5F2ED] opacity-50"
                                    : seleccionada
                                      ? "border-[#22201D] bg-[#F1EEEA]"
                                      : "border-[#E4DED3] bg-white hover:border-[#B8B1A4] hover:bg-[#FAF8F4]"
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                                      seleccionada
                                        ? "border-[#22201D] bg-[#22201D]"
                                        : "border-[#B8B1A4]"
                                    }`}
                                  >
                                    {seleccionada && (
                                      <Check size={11} className="text-white" />
                                    )}
                                  </span>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-[#22201D]">
                                      {opcion.nombre}
                                    </p>

                                    {opcion.agotado && (
                                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-red-600">
                                        Agotado
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {opcion.recargo > 0 && (
                                  <span className="ml-3 whitespace-nowrap font-mono text-xs text-[#6F695E]">
                                    +{money(opcion.recargo)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {grupo.obligatorio &&
                        opcionesDisponibles.length === 0 &&
                        grupo.opciones.length > 0 && (
                          <p className="mt-2 text-xs text-red-600">
                            Todas las opciones de este grupo están agotadas.
                          </p>
                        )}
                    </section>
                  );
                })}

                {/* ==================================================
                    OBSERVACIONES
                ================================================== */}

                <div className="border-t border-[#E4DED3] pt-6">
                  <label
                    htmlFor="observacionesPlato"
                    className="text-sm font-semibold text-[#22201D]"
                  >
                    Observaciones
                  </label>

                  <p className="mt-1 text-xs text-[#8A8375]">
                    Indicaciones especiales para cocina.
                  </p>

                  <textarea
                    id="observacionesPlato"
                    value={observacionesConfiguracion}
                    onChange={(e) =>
                      setObservacionesConfiguracion(e.target.value)
                    }
                    placeholder="Ej. Sin cebolla, poco picante, bien cocido..."
                    maxLength={500}
                    rows={3}
                    className="mt-3 w-full resize-none rounded-md border border-[#E4DED3] bg-white px-3 py-2 text-sm text-[#22201D] outline-none transition placeholder:text-[#B8B1A4] focus:border-[#8A8375] focus:ring-1 focus:ring-[#8A8375]"
                  />

                  <div className="mt-1 text-right text-[10px] text-[#8A8375]">
                    {observacionesConfiguracion.length}/500
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#E4DED3] bg-[#FAF8F4] px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8375]">
                  Precio
                </p>

                <p className="mt-0.5 text-xs text-[#8A8375]">
                  Incluye los recargos seleccionados.
                </p>
              </div>

              <p className="font-mono text-xl font-semibold text-[#22201D]">
                {money(precioConfigurando)}
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-[#E4DED3] bg-white px-6">
            <Button
              type="button"
              variant="outline"
              onClick={cerrarConfiguradorPlato}
              disabled={cargandoConfiguracion || guardando}
              className="cursor-pointer"
            >
              <X size={15} />
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={confirmarConfiguracionPlato}
              disabled={
                cargandoConfiguracion || guardando || !configuracionPlato
              }
              className="cursor-pointer bg-[#22201D] text-white hover:bg-[#3A3732]"
            >
              <Check size={15} />
              Agregar a comanda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

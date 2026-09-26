"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";

import {
  CANAL_COMANDA,
  CATEGORIAS,
  ESTADO_COMANDA,
} from "../constants/constants";

import type {
  Comanda,
  ComandaItem,
  ConfiguracionPlato,
  GrupoMenu,
  ItemSeleccionado,
  Mesa,
  OpcionMenu,
  OpcionSeleccionada,
  Plato,
  RolUsuario,
} from "../types/types";

import {
  buscarComandaMesa,
  calcularTotalComanda,
  calcularTotalSeleccion,
  esGrupoCaldosYSopas,
  generarUid,
  mesaEstaOcupada,
  obtenerFechaColombia,
  obtenerOpcionesItem,
  ordenarMesas,
  normalizarNumeroMesa,
} from "../utils/utils";

export function useMesasPage() {
  
  const router = useRouter();

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [itemsComandas, setItemsComandas] = useState<
    ComandaItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [creandoMesa, setCreandoMesa] = useState(false);
  const [eliminandoMesa, setEliminandoMesa] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [rolUsuario, setRolUsuario] =
    useState<RolUsuario | null>(null);

  const [mesaSeleccionada, setMesaSeleccionada] =
    useState<Mesa | null>(null);

  const [dialogoAbierto, setDialogoAbierto] =
    useState(false);

  const [mesaDetalleCajero, setMesaDetalleCajero] =
    useState<Mesa | null>(null);

  const [dialogoDetalleCajero, setDialogoDetalleCajero] =
    useState(false);

  const [dialogoPagoEfectivo, setDialogoPagoEfectivo] =
    useState(false);

  const [dialogoPagoTransferencia, setDialogoPagoTransferencia] =
    useState(false);

  const [montoRecibido, setMontoRecibido] =
    useState("");

  const [pagando, setPagando] = useState(false);

  const [itemsSeleccionados, setItemsSeleccionados] =
    useState<ItemSeleccionado[]>([]);

  const [busqueda, setBusqueda] = useState("");

  const [dialogoCrearMesa, setDialogoCrearMesa] =
    useState(false);

  const [dialogoEditarMesa, setDialogoEditarMesa] =
    useState(false);

  const [mesaEditando, setMesaEditando] =
    useState<Mesa | null>(null);

  const [numeroMesa, setNumeroMesa] = useState("");

  const [dialogoArmarPlato, setDialogoArmarPlato] =
    useState(false);

  const [platoConfigurando, setPlatoConfigurando] =
    useState<Plato | null>(null);

  const [configuracionPlato, setConfiguracionPlato] =
    useState<ConfiguracionPlato | null>(null);

  const [
    seleccionesConfiguracion,
    setSeleccionesConfiguracion,
  ] = useState<
    Record<string, OpcionSeleccionada[]>
  >({});

  const [
    observacionesConfiguracion,
    setObservacionesConfiguracion,
  ] = useState("");

  const [
    cargandoConfiguracion,
    setCargandoConfiguracion,
  ] = useState(false);

  const esAdmin = rolUsuario === "admin";
  const esCajero = rolUsuario === "cajero";
  const puedeGestionarCaja = esAdmin || esCajero;

  /*
   * ==========================================================
   * AUTENTICACIÓN / ROL
   * ==========================================================
   */

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

      const { data: rol, error: errorRol } =
        await supabase.rpc("rol_actual");

      if (errorRol) {
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

  /*
   * ==========================================================
   * CARGAR DATOS
   * ==========================================================
   */

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
          .order("nombre", {
            ascending: true,
          }),

        supabase
          .from("platos")
          .select(
            "id, nombre, categoria, precio, disponible",
          )
          .eq("disponible", true)
          .order("categoria", {
            ascending: true,
          })
          .order("nombre", {
            ascending: true,
          }),

        supabase
          .from("comandas")
          .select(
            "id, mesa_id, mesero_id, estado",
          )
          .eq(
            "estado",
            ESTADO_COMANDA.ABIERTA,
          )
          .not("mesa_id", "is", null),
      ]);

      if (mesasError) {
        throw new Error(mesasError.message);
      }

      if (platosError) {
        throw new Error(platosError.message);
      }

      if (comandasError) {
        throw new Error(comandasError.message);
      }

      const comandasFinales =
        (comandasData as Comanda[]) ?? [];

      setMesas(
        ordenarMesas(
          (mesasData as Mesa[]) ?? [],
        ),
      );

      setPlatos(
        (platosData as Plato[]) ?? [],
      );

      setComandas(comandasFinales);

      if (comandasFinales.length === 0) {
        setItemsComandas([]);
        return;
      }

      const idsComandas =
        comandasFinales.map(
          (comanda) => comanda.id,
        );

      const {
        data: itemsData,
        error: itemsError,
      } = await supabase
        .from("comanda_items")
        .select(
          "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
        )
        .in("comanda_id", idsComandas)
        .order("creado_en", {
          ascending: true,
        });

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      setItemsComandas(
        (itemsData as ComandaItem[]) ?? [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la información de las mesas.",
      );
    } finally {
      setLoading(false);
    }
  }, [router, cargarRolUsuario]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  /*
   * ==========================================================
   * HELPERS
   * ==========================================================
   */

  const estaOcupada = useCallback(
    (mesaId: string) =>
      mesaEstaOcupada(
        comandas,
        mesaId,
      ),
    [comandas],
  );

  const obtenerComandaMesa = useCallback(
    (mesaId: string) =>
      buscarComandaMesa(
        comandas,
        mesaId,
      ),
    [comandas],
  );

  const obtenerItemsComanda = useCallback(
    (comandaId: string) =>
      itemsComandas.filter(
        (item) =>
          item.comanda_id === comandaId,
      ),
    [itemsComandas],
  );

  const obtenerTotalMesa = useCallback(
    (mesaId: string) => {
      const comanda =
        obtenerComandaMesa(mesaId);

      if (!comanda) {
        return 0;
      }

      return calcularTotalComanda(
        itemsComandas,
        comanda.id,
      );
    },
    [
      obtenerComandaMesa,
      itemsComandas,
    ],
  );

  const total = useMemo(
    () =>
      calcularTotalSeleccion(
        itemsSeleccionados,
      ),
    [itemsSeleccionados],
  );

  const totalMesaCajero = useMemo(() => {
    if (!mesaDetalleCajero) {
      return 0;
    }

    return obtenerTotalMesa(
      mesaDetalleCajero.id,
    );
  }, [
    mesaDetalleCajero,
    obtenerTotalMesa,
  ]);

  const platosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return platos;
    }

    return platos.filter((plato) =>
      plato.nombre
        .toLowerCase()
        .includes(texto),
    );
  }, [platos, busqueda]);

  const platosPorCategoria = useMemo(
    () =>
      CATEGORIAS.map((categoria) => ({
        ...categoria,
        platos:
          platosFiltrados.filter(
            (plato) =>
              plato.categoria ===
              categoria.value,
          ),
      })),
    [platosFiltrados],
  );

  /*
   * ==========================================================
   * CONFIGURACIÓN DE PLATOS
   * ==========================================================
   */

  const cargarConfiguracionPlato = async (
    plato: Plato,
  ): Promise<ConfiguracionPlato | null> => {
    const fecha =
      obtenerFechaColombia();

    const {
      data: menu,
      error: menuError,
    } = await supabase
      .from("menus")
      .select("id, fecha, estado")
      .eq("fecha", fecha)
      .eq("estado", "activo")
      .order("creado_en", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (menuError) {
      throw new Error(menuError.message);
    }

    if (!menu) {
      return null;
    }

    const {
      data: menuPlato,
      error: menuPlatoError,
    } = await supabase
      .from("menu_platos")
      .select(
        "id, menu_id, plato_id, activo",
      )
      .eq("menu_id", menu.id)
      .eq("plato_id", plato.id)
      .eq("activo", true)
      .maybeSingle();

    if (menuPlatoError) {
      throw new Error(
        menuPlatoError.message,
      );
    }

    if (!menuPlato) {
      return null;
    }

    const {
      data: gruposData,
      error: gruposError,
    } = await supabase
      .from("menu_grupos")
      .select(
        "id, menu_plato_id, grupo_id, activo, orden",
      )
      .eq(
        "menu_plato_id",
        menuPlato.id,
      )
      .eq("activo", true)
      .order("orden", {
        ascending: true,
      });

    if (gruposError) {
      throw new Error(
        gruposError.message,
      );
    }

    const grupos = gruposData ?? [];

    if (grupos.length === 0) {
      return null;
    }

    const grupoIds =
      grupos.map(
        (grupo) => grupo.grupo_id,
      );

    const {
      data: gruposBaseData,
      error: gruposBaseError,
    } = await supabase
      .from("menu_categorias_platos")
      .select(
        "id, nombre, obligatorio, orden",
      )
      .in("id", grupoIds);

    if (gruposBaseError) {
      throw new Error(
        gruposBaseError.message,
      );
    }

    const gruposBase =
      gruposBaseData ?? [];

    const gruposBaseMap =
      new Map(
        gruposBase.map(
          (grupo) => [
            grupo.id,
            grupo,
          ],
        ),
      );

    const menuGrupoIds =
      grupos.map(
        (grupo) => grupo.id,
      );

    const {
      data: menuOpcionesData,
      error: menuOpcionesError,
    } = await supabase
      .from("menu_opciones")
      .select(
        "id, menu_grupo_id, opcion_id, activo, orden, agotado",
      )
      .in(
        "menu_grupo_id",
        menuGrupoIds,
      )
      .eq("activo", true)
      .order("orden", {
        ascending: true,
      });

    if (menuOpcionesError) {
      throw new Error(
        menuOpcionesError.message,
      );
    }

    const menuOpciones =
      menuOpcionesData ?? [];

    const crearGrupos = (
      opcionesMap?: Map<
        string,
        {
          id: string;
          nombre: string;
          recargo: number;
        }
      >,
    ) =>
      grupos.map((grupo) => {
        const grupoBase =
          gruposBaseMap.get(
            grupo.grupo_id,
          );

        const caldosYSopas =
          esGrupoCaldosYSopas(
            grupoBase?.nombre ?? "",
          );

        return {
          id: grupo.id,
          grupo_id: grupo.grupo_id,
          nombre:
            grupoBase?.nombre ??
            "Grupo",
          obligatorio:
            caldosYSopas
              ? false
              : Boolean(
                  grupoBase?.obligatorio,
                ),
          orden: Number(
            grupo.orden ??
              grupoBase?.orden ??
              0,
          ),
          opciones:
            opcionesMap
              ? menuOpciones
                  .filter(
                    (menuOpcion) =>
                      menuOpcion.menu_grupo_id ===
                      grupo.id,
                  )
                  .map(
                    (menuOpcion) => {
                      const opcion =
                        opcionesMap.get(
                          menuOpcion.opcion_id,
                        );

                      return {
                        menu_opcion_id:
                          menuOpcion.id,
                        opcion_id:
                          menuOpcion.opcion_id,
                        nombre:
                          opcion?.nombre ??
                          "Opción",
                        recargo:
                          Number(
                            opcion?.recargo ??
                              0,
                          ),
                        agotado:
                          Boolean(
                            menuOpcion.agotado,
                          ),
                        orden:
                          Number(
                            menuOpcion.orden ??
                              0,
                          ),
                      };
                    },
                  )
              : [],
        };
      });

    if (menuOpciones.length === 0) {
      return {
        menu_plato_id:
          menuPlato.id,
        plato_id: plato.id,
        grupos: crearGrupos(),
      };
    }

    const opcionIds =
      menuOpciones.map(
        (item) => item.opcion_id,
      );

    const {
      data: opcionesData,
      error: opcionesError,
    } = await supabase
      .from("opciones_grupo")
      .select(
        "id, nombre, recargo",
      )
      .in("id", opcionIds);

    if (opcionesError) {
      throw new Error(
        opcionesError.message,
      );
    }

    const opcionesMap =
      new Map(
        (opcionesData ?? []).map(
          (opcion) => [
            opcion.id,
            opcion,
          ],
        ),
      );

    return {
      menu_plato_id:
        menuPlato.id,
      plato_id: plato.id,
      grupos:
        crearGrupos(opcionesMap),
    };
  };

  const abrirConfiguradorPlato =
    async (plato: Plato) => {
      setError(null);
      setCargandoConfiguracion(true);
      setPlatoConfigurando(plato);
      setConfiguracionPlato(null);
      setSeleccionesConfiguracion(
        {},
      );
      setObservacionesConfiguracion(
        "",
      );
      setDialogoArmarPlato(true);

      try {
        const configuracion =
          await cargarConfiguracionPlato(
            plato,
          );

        if (!configuracion) {
          setDialogoArmarPlato(false);
          setPlatoConfigurando(null);

          agregarPlatoDirecto(plato);

          return;
        }

        setConfiguracionPlato(
          configuracion,
        );
      } catch (err) {
        setDialogoArmarPlato(false);
        setPlatoConfigurando(null);

        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la configuración del plato.",
        );
      } finally {
        setCargandoConfiguracion(
          false,
        );
      }
    };

  const agregarPlatoDirecto = (
    plato: Plato,
  ) => {
    setItemsSeleccionados(
      (actuales) => {
        const existente =
          actuales.find(
            (item) =>
              item.plato_id ===
                plato.id &&
              !item.configurado,
          );

        if (existente) {
          return actuales.map(
            (item) =>
              item.uid ===
              existente.uid
                ? {
                    ...item,
                    cantidad:
                      item.cantidad +
                      1,
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
            categoria:
              plato.categoria,
            precio: Number(
              plato.precio,
            ),
            cantidad: 1,
            configurado: false,
            observaciones: "",
            opciones: [],
          },
        ];
      },
    );
  };

  const agregarPlato = async (
    plato: Plato,
  ) => {
    await abrirConfiguradorPlato(
      plato,
    );
  };

  const seleccionarOpcion = (
    grupo: GrupoMenu,
    opcion: OpcionMenu,
  ) => {
    if (opcion.agotado) {
      return;
    }

    setSeleccionesConfiguracion(
      (actuales) => {
        const seleccionadas =
          actuales[grupo.id] ?? [];

        const yaSeleccionada =
          seleccionadas.some(
            (item) =>
              item.menu_opcion_id ===
              opcion.menu_opcion_id,
          );

        if (yaSeleccionada) {
          return {
            ...actuales,
            [grupo.id]:
              seleccionadas.filter(
                (item) =>
                  item.menu_opcion_id !==
                  opcion.menu_opcion_id,
              ),
          };
        }

        return {
          ...actuales,
          [grupo.id]: [
            ...seleccionadas,
            {
              menu_opcion_id:
                opcion.menu_opcion_id,
              opcion_id:
                opcion.opcion_id,
              nombre: opcion.nombre,
              grupo_id: grupo.id,
              grupo_nombre:
                grupo.nombre,
              recargo:
                opcion.recargo,
            },
          ],
        };
      },
    );
  };

  const precioConfigurando =
    useMemo(() => {
      if (!platoConfigurando) {
        return 0;
      }

      const recargos =
        Object.values(
          seleccionesConfiguracion,
        )
          .flat()
          .reduce(
            (
              totalRecargos,
              opcion,
            ) =>
              totalRecargos +
              Number(
                opcion.recargo || 0,
              ),
            0,
          );

      return (
        Number(
          platoConfigurando.precio,
        ) + recargos
      );
    }, [
      platoConfigurando,
      seleccionesConfiguracion,
    ]);

  const confirmarConfiguracionPlato =
    () => {
      if (
        !platoConfigurando ||
        !configuracionPlato
      ) {
        return;
      }

      setError(null);

      for (const grupo of
        configuracionPlato.grupos) {
        if (
          esGrupoCaldosYSopas(
            grupo.nombre,
          )
        ) {
          continue;
        }

        if (!grupo.obligatorio) {
          continue;
        }

        const disponibles =
          grupo.opciones.filter(
            (opcion) =>
              !opcion.agotado,
          );

        const seleccionadas =
          seleccionesConfiguracion[
            grupo.id
          ] ?? [];

        if (
          disponibles.length > 0 &&
          seleccionadas.length === 0
        ) {
          setError(
            `Selecciona al menos una opción en "${grupo.nombre}" para "${platoConfigurando.nombre}".`,
          );
          return;
        }

        if (
          disponibles.length === 0 &&
          grupo.opciones.length > 0
        ) {
          setError(
            `No hay opciones disponibles para "${grupo.nombre}".`,
          );
          return;
        }
      }

      const opciones =
        Object.values(
          seleccionesConfiguracion,
        ).flat();

      const nuevoItem: ItemSeleccionado =
        {
          uid: generarUid(),
          plato_id:
            platoConfigurando.id,
          nombre:
            platoConfigurando.nombre,
          categoria:
            platoConfigurando.categoria,
          precio:
            precioConfigurando,
          cantidad: 1,
          configurado: true,
          observaciones:
            observacionesConfiguracion.trim(),
          opciones,
        };

      setItemsSeleccionados(
        (actuales) => [
          ...actuales,
          nuevoItem,
        ],
      );

      cerrarConfiguradorPlato();
    };

  const cerrarConfiguradorPlato =
    () => {
      if (
        cargandoConfiguracion ||
        guardando
      ) {
        return;
      }

      setDialogoArmarPlato(false);
      setPlatoConfigurando(null);
      setConfiguracionPlato(null);
      setSeleccionesConfiguracion(
        {},
      );
      setObservacionesConfiguracion(
        "",
      );
    };

  /*
   * ==========================================================
   * CANTIDADES
   * ==========================================================
   */

  const quitarPlato = (
    platoId: string,
  ) => {
    setItemsSeleccionados(
      (actuales) => {
        const indices =
          actuales
            .map(
              (item, index) =>
                item.plato_id ===
                platoId
                  ? index
                  : -1,
            )
            .filter(
              (index) => index >= 0,
            );

        if (indices.length === 0) {
          return actuales;
        }

        const ultimoIndice =
          indices[indices.length - 1];

        return actuales
          .map(
            (item, index) =>
              index ===
              ultimoIndice
                ? {
                    ...item,
                    cantidad:
                      item.cantidad -
                      1,
                  }
                : item,
          )
          .filter(
            (item) =>
              item.cantidad > 0,
          );
      },
    );
  };

  const incrementarItem = (
    uid: string,
  ) => {
    setItemsSeleccionados(
      (actuales) =>
        actuales.map(
          (item) =>
            item.uid === uid
              ? {
                  ...item,
                  cantidad:
                    item.cantidad + 1,
                }
              : item,
        ),
    );
  };

  const disminuirItem = (
    uid: string,
  ) => {
    setItemsSeleccionados(
      (actuales) =>
        actuales
          .map((item) =>
            item.uid === uid
              ? {
                  ...item,
                  cantidad:
                    item.cantidad - 1,
                }
              : item,
          )
          .filter(
            (item) =>
              item.cantidad > 0,
          ),
    );
  };

  const eliminarPlatoSeleccionado =
    (uid: string) => {
      setItemsSeleccionados(
        (actuales) =>
          actuales.filter(
            (item) =>
              item.uid !== uid,
          ),
      );
    };

  /*
   * ==========================================================
   * CARGAR COMANDA EXISTENTE
   * ==========================================================
   */

  const cargarItemsComanda = async (
    comandaId: string,
  ): Promise<ItemSeleccionado[]> => {
    const {
      data,
      error,
    } = await supabase
      .from("comanda_items")
      .select(
        "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
      )
      .eq("comanda_id", comandaId)
      .order("creado_en", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const items =
      (data as ComandaItem[]) ?? [];

    const padres =
      items.filter(
        (item) =>
          item.item_padre_id === null,
      );

    const hijos =
      items.filter(
        (item) =>
          item.item_padre_id !== null,
      );

    const opcionIds =
      hijos
        .map(
          (item) =>
            item.opcion_id,
        )
        .filter(
          (id): id is string =>
            Boolean(id),
        );

    const menuOpcionIds =
      hijos
        .map(
          (item) =>
            item.menu_opcion_id,
        )
        .filter(
          (id): id is string =>
            Boolean(id),
        );

    const [
      opcionesResult,
      menuOpcionesResult,
    ] = await Promise.all([
      opcionIds.length > 0
        ? supabase
            .from(
              "opciones_grupo",
            )
            .select(
              "id, nombre, recargo",
            )
            .in(
              "id",
              opcionIds,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      menuOpcionIds.length > 0
        ? supabase
            .from(
              "menu_opciones",
            )
            .select(
              "id, menu_grupo_id",
            )
            .in(
              "id",
              menuOpcionIds,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);

    if (opcionesResult.error) {
      throw new Error(
        opcionesResult.error.message,
      );
    }

    if (menuOpcionesResult.error) {
      throw new Error(
        menuOpcionesResult.error.message,
      );
    }

    const opcionesData =
      opcionesResult.data ?? [];

    const menuOpcionesData =
      menuOpcionesResult.data ?? [];

    const menuGrupoIds =
      menuOpcionesData.map(
        (item) =>
          item.menu_grupo_id,
      );

    const {
      data: menuGruposData,
      error: menuGruposError,
    } =
      menuGrupoIds.length > 0
        ? await supabase
            .from(
              "menu_grupos",
            )
            .select(
              "id, grupo_id",
            )
            .in(
              "id",
              menuGrupoIds,
            )
        : {
            data: [],
            error: null,
          };

    if (menuGruposError) {
      throw new Error(
        menuGruposError.message,
      );
    }

    const grupoIds =
      menuGruposData.map(
        (item) =>
          item.grupo_id,
      );

    const {
      data: gruposData,
      error: gruposError,
    } =
      grupoIds.length > 0
        ? await supabase
            .from(
              "menu_categorias_platos",
            )
            .select(
              "id, nombre",
            )
            .in(
              "id",
              grupoIds,
            )
        : {
            data: [],
            error: null,
          };

    if (gruposError) {
      throw new Error(
        gruposError.message,
      );
    }

    const opcionesMap =
      new Map(
        opcionesData.map(
          (opcion) => [
            opcion.id,
            opcion,
          ],
        ),
      );

    const menuOpcionesMap =
      new Map(
        menuOpcionesData.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const menuGruposMap =
      new Map(
        menuGruposData.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    const gruposMap =
      new Map(
        gruposData.map(
          (grupo) => [
            grupo.id,
            grupo,
          ],
        ),
      );

    return padres.map((item) => {
      const plato =
        platos.find(
          (actual) =>
            actual.id ===
            item.plato_id,
        );

      const opciones =
        obtenerOpcionesItem(
          item,
          hijos,
          opcionesMap,
          menuOpcionesMap,
          menuGruposMap,
          gruposMap,
        );

      return {
        uid: generarUid(),
        db_id: item.id,
        plato_id: item.plato_id,
        nombre:
          plato?.nombre ?? "Plato",
        categoria:
          plato?.categoria ?? "",
        precio: Number(
          item.precio_unitario,
        ),
        cantidad: item.cantidad,
        configurado:
          opciones.length > 0,
        observaciones:
          item.observaciones ?? "",
        opciones,
      };
    });
  };

  /*
   * ==========================================================
   * CAJERO
   * ==========================================================
   */

  const abrirDetalleCajero = (
    mesa: Mesa,
  ) => {
    if (
      !puedeGestionarCaja ||
      !estaOcupada(mesa.id)
    ) {
      return;
    }

    setError(null);
    setMesaDetalleCajero(mesa);
    setDialogoDetalleCajero(true);
  };

  const abrirPagoEfectivo = () => {
    if (!puedeGestionarCaja || !mesaDetalleCajero) {
      return;
    }

    const comanda = obtenerComandaMesa(
      mesaDetalleCajero.id,
    );

    if (!comanda) {
      setError("La mesa ya no tiene una comanda abierta.");
      void cargarDatos();
      cerrarDetalleCajero();
      return;
    }

    setError(null);
    setMontoRecibido("");
    setDialogoPagoEfectivo(true);
  };

  const cerrarPagoEfectivo = () => {
    if (pagando) {
      return;
    }

    setDialogoPagoEfectivo(false);
    setMontoRecibido("");
  };

  const abrirPagoTransferencia = () => {
    if (!puedeGestionarCaja || !mesaDetalleCajero) {
      return;
    }

    const comanda = obtenerComandaMesa(
      mesaDetalleCajero.id,
    );

    if (!comanda) {
      setError("La mesa ya no tiene una comanda abierta.");
      void cargarDatos();
      cerrarDetalleCajero();
      return;
    }

    setError(null);
    setDialogoPagoTransferencia(true);
  };

  const cerrarPagoTransferencia = () => {
    if (pagando) {
      return;
    }

    setDialogoPagoTransferencia(false);
  };

  const confirmarPagoTransferencia = async () => {
    if (!mesaDetalleCajero) {
      return;
    }

    const comanda = obtenerComandaMesa(
      mesaDetalleCajero.id,
    );

    if (!comanda) {
      setError("La mesa ya no tiene una comanda abierta.");
      cerrarPagoTransferencia();
      cerrarDetalleCajero();
      await cargarDatos();
      return;
    }

    if (totalMesaCajero <= 0) {
      setError("La comanda no tiene un total válido para cobrar.");
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
    setPagando(true);

    try {
      const { error: errorPago } = await supabase.rpc(
        "confirmar_pago_transferencia",
        {
          p_comanda_id: comanda.id,
        },
      );

      if (errorPago) {
        throw new Error(errorPago.message);
      }

      setDialogoPagoTransferencia(false);
      setDialogoDetalleCajero(false);
      setMesaDetalleCajero(null);

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el pago por transferencia.",
      );
    } finally {
      setPagando(false);
    }
  };

  const confirmarPagoEfectivo = async () => {
    if (!mesaDetalleCajero) {
      return;
    }

    const comanda = obtenerComandaMesa(
      mesaDetalleCajero.id,
    );

    if (!comanda) {
      setError("La mesa ya no tiene una comanda abierta.");
      cerrarPagoEfectivo();
      cerrarDetalleCajero();
      await cargarDatos();
      return;
    }

    const recibido = Number(montoRecibido);

    if (!Number.isFinite(recibido) || recibido <= 0) {
      setError("Ingresa un monto recibido válido.");
      return;
    }

    if (recibido < totalMesaCajero) {
      setError(
        "El dinero recibido es insuficiente. Total: " +
          totalMesaCajero,
      );
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
    setPagando(true);

    try {
      const { error: errorPago } = await supabase.rpc(
        "confirmar_pago_efectivo",
        {
          p_comanda_id: comanda.id,
          p_monto_recibido: recibido,
        },
      );

      if (errorPago) {
        throw new Error(errorPago.message);
      }

      setDialogoPagoEfectivo(false);
      setMontoRecibido("");
      setDialogoDetalleCajero(false);
      setMesaDetalleCajero(null);

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el pago en efectivo.",
      );
    } finally {
      setPagando(false);
    }
  };

  const cerrarDetalleCajero = () => {
    if (pagando) {
      return;
    }

    setDialogoDetalleCajero(false);
    setMesaDetalleCajero(null);
  };

  /*
   * ==========================================================
   * ABRIR MESA
   * ==========================================================
   */

  const obtenerItemsMesa = useCallback(
    (mesaId: string) => {
      const comanda = obtenerComandaMesa(mesaId);
  
      if (!comanda) {
        return [];
      }
  
      return obtenerItemsComanda(comanda.id);
    },
    [
      obtenerComandaMesa,
      obtenerItemsComanda,
    ],
  );

  const abrirMesa = async (
    mesa: Mesa,
  ) => {
    setError(null);

    if (puedeGestionarCaja) {
      abrirDetalleCajero(mesa);
      return;
    }

    setMesaSeleccionada(mesa);
    setBusqueda("");

    const comanda =
      obtenerComandaMesa(mesa.id);

    if (!comanda) {
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

      const items =
        await cargarItemsComanda(
          comanda.id,
        );

      setItemsSeleccionados(items);
      setDialogoAbierto(true);
    } catch {
      setError(
        "No se pudo cargar la comanda de la mesa.",
      );
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

  /*
   * ==========================================================
   * CREAR MESA
   * ==========================================================
   */

  const abrirCrearMesa = () => {
    setError(null);
    setNumeroMesa("");
    setDialogoCrearMesa(true);
  };

  const crearMesa = async () => {
    const numero =
      numeroMesa.trim();

    if (!numero) {
      setError(
        "Ingresa el número de la mesa.",
      );
      return;
    }

    if (!/^\d+$/.test(numero)) {
      setError(
        "El número de mesa debe contener únicamente números.",
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const numeroNormalizado =
      normalizarNumeroMesa(
        numero,
      );

    const nombre =
      `Mesa ${numeroNormalizado}`;

    const yaExiste =
      mesas.some(
        (mesa) =>
          mesa.nombre.toLowerCase() ===
          nombre.toLowerCase(),
      );

    if (yaExiste) {
      setError(
        `La ${nombre} ya existe.`,
      );
      return;
    }

    setError(null);
    setCreandoMesa(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("mesas")
        .insert({
          nombre,
          activa: true,
        })
        .select(
          "id, nombre, activa",
        )
        .single();

      if (error) {
        throw new Error(
          error.message,
        );
      }

      setMesas(
        ordenarMesas([
          ...mesas,
          data as Mesa,
        ]),
      );

      setNumeroMesa("");
      setDialogoCrearMesa(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la mesa.",
      );
    } finally {
      setCreandoMesa(false);
    }
  };

  /*
   * ==========================================================
   * EDITAR MESA
   * ==========================================================
   */

  const abrirEditarMesa = (
    event: MouseEvent,
    mesa: Mesa,
  ) => {
    event.stopPropagation();

    if (!esAdmin) {
      return;
    }

    setError(null);

    setMesaEditando(mesa);
    setNumeroMesa(
      mesa.nombre.replace(
        /^mesa\s*/i,
        "",
      ),
    );
    setDialogoEditarMesa(true);
  };

  const editarMesa = async () => {
    if (!mesaEditando) {
      return;
    }

    const numero =
      numeroMesa.trim();

    if (!numero) {
      setError(
        "Ingresa el número de la mesa.",
      );
      return;
    }

    if (!/^\d+$/.test(numero)) {
      setError(
        "El número de mesa debe contener únicamente números.",
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const numeroNormalizado =
      normalizarNumeroMesa(
        numero,
      );

    const nombre =
      `Mesa ${numeroNormalizado}`;

    const yaExiste =
      mesas.some(
        (mesa) =>
          mesa.id !==
            mesaEditando.id &&
          mesa.nombre.toLowerCase() ===
            nombre.toLowerCase(),
      );

    if (yaExiste) {
      setError(
        `La ${nombre} ya existe.`,
      );
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("mesas")
        .update({
          nombre,
        })
        .eq(
          "id",
          mesaEditando.id,
        )
        .select(
          "id, nombre, activa",
        )
        .single();

      if (error) {
        throw new Error(
          error.message,
        );
      }

      setMesas(
        ordenarMesas(
          mesas.map(
            (mesa) =>
              mesa.id ===
              mesaEditando.id
                ? (data as Mesa)
                : mesa,
          ),
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

  /*
   * ==========================================================
   * ELIMINAR MESA
   * ==========================================================
   */

  const eliminarMesa = async (
    event: MouseEvent,
    mesa: Mesa,
  ) => {
    event.stopPropagation();

    if (!esAdmin) {
      return;
    }

    if (estaOcupada(mesa.id)) {
      setError(
        `No puedes eliminar ${mesa.nombre} porque tiene una comanda abierta.`,
      );
      return;
    }

    const confirmar =
      window.confirm(
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
      const { error } =
        await supabase
          .from("mesas")
          .delete()
          .eq("id", mesa.id);

      if (error) {
        throw new Error(
          error.message,
        );
      }

      setMesas(
        (actuales) =>
          actuales.filter(
            (actual) =>
              actual.id !== mesa.id,
          ),
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

  /*
   * ==========================================================
   * CONFIRMAR COMANDA
   * ==========================================================
   */

  const confirmarComanda =
    async () => {
      if (!mesaSeleccionada) {
        return;
      }

      if (
        itemsSeleccionados.length ===
        0
      ) {
        setError(
          "Agrega al menos un plato a la comanda.",
        );
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
        const usuarioId =
          user.id;

        let comanda =
          obtenerComandaMesa(
            mesaSeleccionada.id,
          );

        if (!comanda) {
          const {
            data: nuevaComanda,
            error:
              errorComanda,
          } = await supabase
            .from("comandas")
            .insert({
              canal:
                CANAL_COMANDA,
              mesa_id:
                mesaSeleccionada.id,
              mesero_id:
                usuarioId,
              estado:
                ESTADO_COMANDA.ABIERTA,
            })
            .select(
              "id, mesa_id, mesero_id, estado",
            )
            .single();

          if (
            errorComanda ||
            !nuevaComanda
          ) {
            if (
              errorComanda?.code ===
              "23505"
            ) {
              await cargarDatos();

              throw new Error(
                "Esta mesa acaba de ser ocupada por otro mesero.",
              );
            }

            throw new Error(
              errorComanda?.message ??
                "No se pudo crear la comanda.",
            );
          }

          comanda =
            nuevaComanda as Comanda;

          const padres =
            itemsSeleccionados.map(
              (item) => ({
                comanda_id:
                  comanda!.id,
                plato_id:
                  item.plato_id,
                item_padre_id:
                  null,
                opcion_id: null,
                menu_opcion_id:
                  null,
                cantidad:
                  item.cantidad,
                precio_unitario:
                  item.precio,
                estado: "pendiente",
                observaciones:
                  item.observaciones
                    .trim() ||
                  null,
              }),
            );

          const {
            data: padresInsertados,
            error:
              errorPadres,
          } = await supabase
            .from(
              "comanda_items",
            )
            .insert(padres)
            .select(
              "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
            );

          if (
            errorPadres ||
            !padresInsertados
          ) {
            await supabase
              .from("comandas")
              .delete()
              .eq(
                "id",
                comanda.id,
              );

            throw new Error(
              errorPadres?.message ??
                "No se pudieron guardar los productos.",
            );
          }

          const opciones: Array<{
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

          itemsSeleccionados.forEach(
            (item, index) => {
              const padre =
                padresInsertados[
                  index
                ];

              if (
                !padre ||
                !item.configurado
              ) {
                return;
              }

              item.opciones.forEach(
                (opcion) => {
                  opciones.push({
                    comanda_id:
                      comanda!.id,
                    plato_id:
                      item.plato_id,
                    item_padre_id:
                      padre.id,
                    opcion_id:
                      opcion.opcion_id,
                    menu_opcion_id:
                      opcion.menu_opcion_id,
                    cantidad:
                      item.cantidad,
                    precio_unitario: 0,
                    estado:
                      "pendiente",
                    observaciones:
                      null,
                  });
                },
              );
            },
          );

          if (
            opciones.length > 0
          ) {
            const {
              error:
                errorOpciones,
            } = await supabase
              .from(
                "comanda_items",
              )
              .insert(
                opciones,
              );

            if (errorOpciones) {
              await supabase
                .from(
                  "comanda_items",
                )
                .delete()
                .eq(
                  "comanda_id",
                  comanda.id,
                );

              await supabase
                .from(
                  "comandas",
                )
                .delete()
                .eq(
                  "id",
                  comanda.id,
                );

              throw new Error(
                errorOpciones.message,
              );
            }
          }
        } else {
          const {
            data:
              itemsActualesData,
            error:
              errorItemsActuales,
          } = await supabase
            .from(
              "comanda_items",
            )
            .select(
              "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
            )
            .eq(
              "comanda_id",
              comanda.id,
            )
            .order(
              "creado_en",
              {
                ascending:
                  true,
              },
            );

          if (
            errorItemsActuales
          ) {
            throw new Error(
              errorItemsActuales.message,
            );
          }

          const itemsActuales =
            (itemsActualesData as ComandaItem[]) ??
            [];

          const padresActuales =
            itemsActuales.filter(
              (item) =>
                item.item_padre_id ===
                null,
            );

          const hijosActuales =
            itemsActuales.filter(
              (item) =>
                item.item_padre_id !==
                null,
            );

          const idsExistentes =
            new Set(
              itemsSeleccionados
                .map(
                  (item) =>
                    item.db_id,
                )
                .filter(
                  (
                    id,
                  ): id is string =>
                    Boolean(id),
                ),
            );

          for (const padre of padresActuales) {
            if (
              idsExistentes.has(
                padre.id,
              )
            ) {
              continue;
            }

            const {
              error:
                errorHijos,
            } = await supabase
              .from(
                "comanda_items",
              )
              .delete()
              .eq(
                "item_padre_id",
                padre.id,
              );

            if (errorHijos) {
              throw new Error(
                errorHijos.message,
              );
            }

            const {
              error:
                errorPadre,
            } = await supabase
              .from(
                "comanda_items",
              )
              .delete()
              .eq(
                "id",
                padre.id,
              );

            if (errorPadre) {
              throw new Error(
                errorPadre.message,
              );
            }
          }

          for (const item of itemsSeleccionados) {
            if (item.db_id) {
              const padreActual =
                padresActuales.find(
                  (padre) =>
                    padre.id ===
                    item.db_id,
                );

              if (!padreActual) {
                continue;
              }

              const cantidadCambio =
                Number(
                  padreActual.cantidad,
                ) !==
                Number(
                  item.cantidad,
                );

              const precioCambio =
                Number(
                  padreActual.precio_unitario,
                ) !==
                Number(item.precio);

              const observacionesActuales =
                padreActual.observaciones?.trim() ??
                "";

              const observacionesNuevas =
                item.observaciones.trim();

              const observacionesCambio =
                observacionesActuales !==
                observacionesNuevas;

              if (
                cantidadCambio ||
                precioCambio ||
                observacionesCambio
              ) {
                const {
                  error:
                    errorUpdate,
                } = await supabase
                  .from(
                    "comanda_items",
                  )
                  .update({
                    cantidad:
                      item.cantidad,
                    precio_unitario:
                      item.precio,
                    observaciones:
                      observacionesNuevas ||
                      null,
                  })
                  .eq(
                    "id",
                    padreActual.id,
                  );

                if (errorUpdate) {
                  throw new Error(
                    errorUpdate.message,
                  );
                }
              }

              if (
                item.configurado
              ) {
                const hijosDelPadre =
                  hijosActuales.filter(
                    (hijo) =>
                      hijo.item_padre_id ===
                      padreActual.id,
                  );

                const actuales =
                  new Set(
                    hijosDelPadre.map(
                      (hijo) =>
                        `${hijo.opcion_id}|${hijo.menu_opcion_id}`,
                    ),
                  );

                const nuevas =
                  new Set(
                    item.opciones.map(
                      (opcion) =>
                        `${opcion.opcion_id}|${opcion.menu_opcion_id}`,
                    ),
                  );

                const cambiaron =
                  actuales.size !==
                    nuevas.size ||
                  [...actuales].some(
                    (opcion) =>
                      !nuevas.has(
                        opcion,
                      ),
                  );

                if (cambiaron) {
                  const {
                    error:
                      errorDelete,
                  } = await supabase
                    .from(
                      "comanda_items",
                    )
                    .delete()
                    .eq(
                      "item_padre_id",
                      padreActual.id,
                    );

                  if (errorDelete) {
                    throw new Error(
                      errorDelete.message,
                    );
                  }

                  const nuevasOpciones =
                    item.opciones.map(
                      (opcion) => ({
                        comanda_id:
                          comanda!.id,
                        plato_id:
                          item.plato_id,
                        item_padre_id:
                          padreActual.id,
                        opcion_id:
                          opcion.opcion_id,
                        menu_opcion_id:
                          opcion.menu_opcion_id,
                        cantidad:
                          item.cantidad,
                        precio_unitario:
                          0,
                        estado:
                          "pendiente",
                        observaciones:
                          null,
                      }),
                    );

                  if (
                    nuevasOpciones.length >
                    0
                  ) {
                    const {
                      error:
                        errorInsert,
                    } =
                      await supabase
                        .from(
                          "comanda_items",
                        )
                        .insert(
                          nuevasOpciones,
                        );

                    if (errorInsert) {
                      throw new Error(
                        errorInsert.message,
                      );
                    }
                  }
                } else if (
                  cantidadCambio
                ) {
                  for (const hijo of hijosDelPadre) {
                    const {
                      error:
                        errorHijo,
                    } =
                      await supabase
                        .from(
                          "comanda_items",
                        )
                        .update({
                          cantidad:
                            item.cantidad,
                        })
                        .eq(
                          "id",
                          hijo.id,
                        );

                    if (errorHijo) {
                      throw new Error(
                        errorHijo.message,
                      );
                    }
                  }
                }
              }

              continue;
            }

            const {
              data: nuevoPadre,
              error:
                errorNuevoPadre,
            } = await supabase
              .from(
                "comanda_items",
              )
              .insert({
                comanda_id:
                  comanda.id,
                plato_id:
                  item.plato_id,
                item_padre_id:
                  null,
                opcion_id: null,
                menu_opcion_id:
                  null,
                cantidad:
                  item.cantidad,
                precio_unitario:
                  item.precio,
                estado:
                  "pendiente",
                observaciones:
                  item.observaciones
                    .trim() ||
                  null,
              })
              .select(
                "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
              )
              .single();

            if (
              errorNuevoPadre ||
              !nuevoPadre
            ) {
              throw new Error(
                errorNuevoPadre?.message ??
                  "No se pudo agregar el nuevo producto.",
              );
            }

            if (
              item.configurado &&
              item.opciones.length >
                0
            ) {
              const opcionesNuevas =
                item.opciones.map(
                  (opcion) => ({
                    comanda_id:
                      comanda!.id,
                    plato_id:
                      item.plato_id,
                    item_padre_id:
                      nuevoPadre.id,
                    opcion_id:
                      opcion.opcion_id,
                    menu_opcion_id:
                      opcion.menu_opcion_id,
                    cantidad:
                      item.cantidad,
                    precio_unitario:
                      0,
                    estado:
                      "pendiente",
                    observaciones:
                      null,
                  }),
                );

              const {
                error:
                  errorOpciones,
              } = await supabase
                .from(
                  "comanda_items",
                )
                .insert(
                  opcionesNuevas,
                );

              if (errorOpciones) {
                throw new Error(
                  errorOpciones.message,
                );
              }
            }
          }
        }

        await cargarDatos();

        cerrarDialogo();
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

  /*
   * ==========================================================
   * LIBERAR MESA
   * ==========================================================
   */

  const liberarMesa = async () => {
    if (!mesaSeleccionada) {
      return;
    }

    const comanda =
      obtenerComandaMesa(
        mesaSeleccionada.id,
      );

    if (!comanda) {
      cerrarDialogo();
      return;
    }

    const confirmar =
      window.confirm(
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
      const {
        error: errorItems,
      } = await supabase
        .from(
          "comanda_items",
        )
        .delete()
        .eq(
          "comanda_id",
          comanda.id,
        );

      if (errorItems) {
        throw new Error(
          errorItems.message,
        );
      }

      const {
        error: errorComanda,
      } = await supabase
        .from("comandas")
        .delete()
        .eq(
          "id",
          comanda.id,
        );

      if (errorComanda) {
        throw new Error(
          errorComanda.message,
        );
      }

      setComandas(
        (actuales) =>
          actuales.filter(
            (actual) =>
              actual.id !==
              comanda.id,
          ),
      );

      setItemsComandas(
        (actuales) =>
          actuales.filter(
            (item) =>
              item.comanda_id !==
              comanda.id,
          ),
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

  return {
    mesas,
    platos,
    comandas,
    itemsComandas,

    loading,
    guardando,
    creandoMesa,
    eliminandoMesa,

    error,
    setError,

    rolUsuario,
    esAdmin,
    esCajero,
    puedeGestionarCaja,

    mesaSeleccionada,
    dialogoAbierto,

    mesaDetalleCajero,
    dialogoDetalleCajero,
    dialogoPagoEfectivo,
    dialogoPagoTransferencia,
    montoRecibido,
    pagando,

    itemsSeleccionados,
    busqueda,

    dialogoCrearMesa,
    dialogoEditarMesa,
    mesaEditando,
    numeroMesa,

    dialogoArmarPlato,
    platoConfigurando,
    configuracionPlato,
    seleccionesConfiguracion,
    observacionesConfiguracion,
    cargandoConfiguracion,

    total,
    totalMesaCajero,
    platosFiltrados,
    platosPorCategoria,
    precioConfigurando,

    estaOcupada,
    obtenerItemsComanda,
    obtenerTotalMesa,

    abrirMesa,
    cerrarDialogo,

    abrirCrearMesa,
    crearMesa,

    abrirEditarMesa,
    editarMesa,

    eliminarMesa,

    confirmarComanda,
    liberarMesa,

    abrirDetalleCajero,
    cerrarDetalleCajero,
    abrirPagoEfectivo,
    cerrarPagoEfectivo,
    confirmarPagoEfectivo,
    abrirPagoTransferencia,
    cerrarPagoTransferencia,
    confirmarPagoTransferencia,
    setMontoRecibido,

    agregarPlato,
    quitarPlato,
    incrementarItem,
    disminuirItem,
    eliminarPlatoSeleccionado,

    seleccionarOpcion,
    confirmarConfiguracionPlato,
    cerrarConfiguradorPlato,

    setBusqueda,
    setNumeroMesa,
    setDialogoCrearMesa,
    setDialogoEditarMesa,
    setDialogoArmarPlato,
    setObservacionesConfiguracion,
    setMesaEditando,
    
    obtenerItemsMesa,

    cargarDatos,
  };
}
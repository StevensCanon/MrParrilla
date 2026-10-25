"use client";

import {
  useCallback,
  useMemo,
  useEffect,
  useState,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";


import { supabase } from "@/lib/supabaseClient";
import { obtenerUsuarioAutenticado } from "../services/auth";
import { cargarDatosMesas } from "../services/mesasData";
import { cargarConfiguracionPlato } from "../services/platos";
import {
  cargarItemsComanda as cargarItemsComandaService,
  confirmarComanda as confirmarComandaService,
  liberarComanda,
} from "../services/comandas";
import {
  crearMesa as crearMesaService,
  editarMesa as editarMesaService,
  eliminarMesa as eliminarMesaService,
  ordenarListaMesas,
  unirMesas as unirMesasService,
} from "../services/mesas";
import {
  configurarDivisionCuenta as configurarDivisionCuentaService,
  registrarPagoParcial,
  registrarPagoPersona,
} from "../services/pagos";

import { CATEGORIAS } from "../constants/constants";

import type {
  Comanda,
  ComandaItem,
  AsignacionPlatoPersona,
  ConfiguracionPlato,
  CuentaPersona,
  GrupoMenu,
  ItemSeleccionado,
  Mesa,
  PagoMesa,
  OpcionMenu,
  OpcionSeleccionada,
  Plato,
  RolUsuario,
} from "../types/types";

import {
  buscarComandaMesa,
  calcularTotalComanda,
  calcularTotalSeleccion,
  generarUid,
  normalizarNumeroMesa,
  esGrupoCaldosYSopas,
} from "../utils/utils";

export function useMesasPage() {
  
  const router = useRouter();




  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [itemsComandas, setItemsComandas] = useState<
    ComandaItem[]
  >([]);
  const [pagos, setPagos] = useState<PagoMesa[]>([]);
  const [cuentasPersonas, setCuentasPersonas] = useState<CuentaPersona[]>([]);

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

  const [dialogoUnirMesas, setDialogoUnirMesas] = useState(false);
  const [mesaPrincipalId, setMesaPrincipalId] = useState("");
  const [mesaSecundariaId, setMesaSecundariaId] = useState("");
  const [uniendoMesas, setUniendoMesas] = useState(false);
  const [dialogoDividirCuenta, setDialogoDividirCuenta] = useState(false);
  const [personaCobrandoId, setPersonaCobrandoId] = useState<string | null>(null);

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

  /*
   * ==========================================================
   * CARGAR DATOS
   * ==========================================================
   */

  const cargarDatos = useCallback(async () => {
    try {
      const usuario = await obtenerUsuarioAutenticado();

      if (!usuario) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError(null);
      setRolUsuario(usuario.rol);

      if (!usuario.rol) {
        return;
      }

      const datos = await cargarDatosMesas();

      setMesas(datos.mesas);
      setPlatos(datos.platos);
      setComandas(datos.comandas);
      setItemsComandas(datos.itemsComandas);
      setPagos(datos.pagos);
      setCuentasPersonas(datos.cuentasPersonas);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la información de las mesas.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelado = false;
  
    const cargarDatosIniciales = async () => {
      try {
        const usuario = await obtenerUsuarioAutenticado();
  
        if (cancelado) return;
  
        if (!usuario) {
          router.replace("/login");
          return;
        }
  
        setRolUsuario(usuario.rol);
  
        if (!usuario.rol) {
          setError("No se pudo obtener el rol del usuario.");
          return;
        }
  
        const datos = await cargarDatosMesas();
  
        if (cancelado) return;
  
        setMesas(datos.mesas);
        setPlatos(datos.platos);
        setComandas(datos.comandas);
        setItemsComandas(datos.itemsComandas);
        setPagos(datos.pagos);
        setCuentasPersonas(datos.cuentasPersonas);
      } catch (err) {
        if (cancelado) return;
  
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la información de las mesas.",
        );
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    };
  
    void cargarDatosIniciales();
  
    return () => {
      cancelado = true;
    };
  }, [router]);

  /*
   * ACTUALIZACIÓN EN TIEMPO REAL
   */
  useEffect(() => {
    let desmontado = false;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let intervalo: ReturnType<typeof setInterval> | undefined;
    let actualizando = false;

    const actualizarDatos = async () => {
      if (desmontado || actualizando || document.visibilityState !== "visible") {
        return;
      }

      actualizando = true;
      try {
        const datos = await cargarDatosMesas();

        if (desmontado) return;

        setMesas(datos.mesas);
        setPlatos(datos.platos);
        setComandas(datos.comandas);
        setItemsComandas(datos.itemsComandas);
        setPagos(datos.pagos);
        setCuentasPersonas(datos.cuentasPersonas);
      } catch (err) {
        if (desmontado) return;

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron actualizar las mesas.",
        );
      } finally {
        actualizando = false;
      }
    };

    // Agrupa los eventos de una misma operación.
    const programarActualizacion = () => {
      if (temporizador) clearTimeout(temporizador);

      temporizador = setTimeout(() => {
        void actualizarDatos();
      }, 150);
    };

    const canal = supabase
      .channel("mesas-tiempo-real")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comandas" },
        programarActualizacion,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comanda_items" },
        programarActualizacion,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mesas" },
        programarActualizacion,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pagos" },
        programarActualizacion,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comanda_personas" },
        programarActualizacion,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comanda_persona_items" },
        programarActualizacion,
      )
      .subscribe();

    // Respaldo si Supabase Realtime aún no entrega eventos en este proyecto.
    intervalo = setInterval(programarActualizacion, 3000);
    document.addEventListener("visibilitychange", programarActualizacion);

    return () => {
      desmontado = true;

      if (temporizador) clearTimeout(temporizador);
      if (intervalo) clearInterval(intervalo);
      document.removeEventListener("visibilitychange", programarActualizacion);

      void supabase.removeChannel(canal);
    };
  }, []);

  /*
   * ==========================================================
   * HELPERS
   * ==========================================================
   */

  const obtenerMesaPrincipalId = useCallback(
    (mesaId: string) => mesas.find((mesa) => mesa.id === mesaId)?.unida_a ?? mesaId,
    [mesas],
  );

  const estaOcupada = useCallback(
    (mesaId: string) => {
      const mesaPrincipalId = obtenerMesaPrincipalId(mesaId);
      return comandas.some(
        (comanda) =>
          comanda.mesa_id === mesaPrincipalId &&
          comanda.estado === "abierta" &&
          itemsComandas.some(
            (item) =>
              item.comanda_id === comanda.id &&
              item.item_padre_id === null,
          ),
      );
    },
    [comandas, itemsComandas, obtenerMesaPrincipalId],
  );

  const obtenerComandaMesa = useCallback(
    (mesaId: string) => buscarComandaMesa(comandas, obtenerMesaPrincipalId(mesaId)),
    [comandas, obtenerMesaPrincipalId],
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

  const comandaMesaCajero = mesaDetalleCajero
    ? obtenerComandaMesa(mesaDetalleCajero.id)
    : null;
  const totalPagadoMesaCajero = comandaMesaCajero
    ? pagos
        .filter((pago) => pago.comanda_id === comandaMesaCajero.id)
        .reduce((total, pago) => total + Number(pago.monto), 0)
    : 0;
  const saldoPendienteMesaCajero = Math.max(
    totalMesaCajero - totalPagadoMesaCajero,
    0,
  );
  const cuentasPersonasMesaCajero = comandaMesaCajero
    ? cuentasPersonas.filter((persona) => persona.comanda_id === comandaMesaCajero.id)
    : [];
  const personaCobrando = cuentasPersonasMesaCajero.find(
    (persona) => persona.id === personaCobrandoId,
  ) ?? null;
  const montoParteAnterior = comandaMesaCajero?.division_partes &&
    cuentasPersonasMesaCajero.length === 0 &&
    comandaMesaCajero.division_partes_pagadas > 0
    ? (() => {
        const partes = comandaMesaCajero.division_partes!;
        const base = Math.floor(totalMesaCajero / partes);
        return comandaMesaCajero.division_partes_pagadas + 1 === partes
          ? totalMesaCajero - base * (partes - 1)
          : base;
      })()
    : 0;
  const montoSiguienteParte = comandaMesaCajero?.division_partes != null
    ? cuentasPersonasMesaCajero.length > 0
      ? (personaCobrando && !personaCobrando.pagada ? personaCobrando.monto_total : 0)
      : montoParteAnterior
    : saldoPendienteMesaCajero;

  const platosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return platos;
    }

    return platos.filter((plato) =>
      plato.nombre.toLowerCase().includes(texto),
    );
  }, [platos, busqueda]);

  const platosPorCategoria = useMemo(() => {
    const categoriasConPlatos: {
      value: string;
      label: string;
      platos: Plato[];
    }[] = CATEGORIAS.map((categoria) => ({
      ...categoria,
      platos: platosFiltrados.filter(
        (plato) => (plato.categoria ?? "").trim().toLowerCase() === categoria.value,
      ),
    }));
    const platosSinCategoriaConocida = platosFiltrados.filter(
      (plato) =>
        !CATEGORIAS.some(
          (categoria) =>
            categoria.value === (plato.categoria ?? "").trim().toLowerCase(),
        ),
    );

    if (platosSinCategoriaConocida.length > 0) {
      categoriasConPlatos.push({
        value: "otros",
        label: "Otros",
        platos: platosSinCategoriaConocida,
      });
    }

    return categoriasConPlatos;
  }, [platosFiltrados]);

  /*
   * ==========================================================
   * CONFIGURACIÓN DE PLATOS
   * ==========================================================
   */

  const abrirConfiguradorPlato =
    async (plato: Plato) => {
      if (!plato.disponible) {
        return;
      }

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

      for (const grupo of configuracionPlato.grupos) {
        if (esGrupoCaldosYSopas(grupo.nombre)) {
          continue;
        }

        if (!grupo.obligatorio) {
          continue;
        }

        const disponibles = grupo.opciones.filter(
          (opcion) => !opcion.agotado,
        );

        const seleccionadas =
          seleccionesConfiguracion[grupo.id] ?? [];

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

      const opciones = Object.values(
        seleccionesConfiguracion,
      ).flat();

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

      setItemsSeleccionados((actuales) => [
        ...actuales,
        nuevoItem,
      ]);

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
  ): Promise<ItemSeleccionado[]> =>
    cargarItemsComandaService(comandaId, platos);

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

    if (!obtenerComandaMesa(mesa.id)) {
      setError("La mesa unida todavía no tiene una cuenta abierta.");
      return;
    }

    const mesaPrincipal = mesas.find(
      (actual) => actual.id === obtenerMesaPrincipalId(mesa.id),
    ) ?? mesa;

    setError(null);
    setMesaDetalleCajero(mesaPrincipal);
    setDialogoDetalleCajero(true);
  };

  const obtenerMontoPersona = (comandaId: string, personaId: string | null) => {
    if (!personaId) return 0;
    const persona = cuentasPersonas.find(
      (actual) => actual.id === personaId && actual.comanda_id === comandaId,
    );
    return persona && !persona.pagada ? persona.monto_total : 0;
  };

  const abrirPagoEfectivo = (personaId?: string) => {
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

    const idPersona = personaId ?? personaCobrandoId;
    const tieneDivisionPorPlatos = cuentasPersonas.some((persona) => persona.comanda_id === comanda.id);
    const monto = comanda.division_partes !== null && tieneDivisionPorPlatos
      ? obtenerMontoPersona(comanda.id, idPersona)
      : montoSiguienteParte;
    if (monto <= 0) {
      setError(comanda.division_partes !== null && tieneDivisionPorPlatos
        ? "Selecciona una persona con pago pendiente."
        : "La cuenta ya no tiene saldo pendiente.");
      return;
    }

    setPersonaCobrandoId(idPersona ?? null);
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
    setPersonaCobrandoId(null);
  };

  const abrirPagoTransferencia = (personaId?: string) => {
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

    const idPersona = personaId ?? personaCobrandoId;
    const tieneDivisionPorPlatos = cuentasPersonas.some((persona) => persona.comanda_id === comanda.id);
    const monto = comanda.division_partes !== null && tieneDivisionPorPlatos
      ? obtenerMontoPersona(comanda.id, idPersona)
      : montoSiguienteParte;
    if (monto <= 0) {
      setError(comanda.division_partes !== null && tieneDivisionPorPlatos
        ? "Selecciona una persona con pago pendiente."
        : "La cuenta ya no tiene saldo pendiente.");
      return;
    }

    setPersonaCobrandoId(idPersona ?? null);
    setError(null);
    setDialogoPagoTransferencia(true);
  };

  const cerrarPagoTransferencia = () => {
    if (pagando) {
      return;
    }

    setDialogoPagoTransferencia(false);
    setPersonaCobrandoId(null);
  };

  const confirmarPagoTransferencia = async () => {
    if (!mesaDetalleCajero) {
      return;
    }

    const comanda = obtenerComandaMesa(mesaDetalleCajero.id);

    if (!comanda) {
      setError("La mesa ya no tiene una comanda abierta.");
      cerrarPagoTransferencia();
      cerrarDetalleCajero();
      await cargarDatos();
      return;
    }

    if (montoSiguienteParte <= 0) {
      setError("La comanda no tiene un total válido para cobrar.");
      return;
    }

    const usuario = await obtenerUsuarioAutenticado();

    if (!usuario) {
      router.push("/login");
      return;
    }

    setError(null);
    setPagando(true);

    try {
      const tieneDivisionPorPlatos = cuentasPersonas.some((persona) => persona.comanda_id === comanda.id);
      const resultado = comanda.division_partes !== null && tieneDivisionPorPlatos
        ? await registrarPagoPersona({
            comandaId: comanda.id,
            personaId: personaCobrandoId ?? "",
            metodo: "transferencia",
          })
        : await registrarPagoParcial({
            comandaId: comanda.id,
            monto: montoSiguienteParte,
            metodo: "transferencia",
          });
      setDialogoPagoTransferencia(false);
      setPersonaCobrandoId(null);
      if (resultado.cerrada) {
        setDialogoDetalleCajero(false);
        setMesaDetalleCajero(null);
      }
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

    const comanda = obtenerComandaMesa(mesaDetalleCajero.id);

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

    if (recibido < montoSiguienteParte) {
      setError(
        "El dinero recibido es insuficiente. Total: " + montoSiguienteParte,
      );
      return;
    }

    const usuario = await obtenerUsuarioAutenticado();

    if (!usuario) {
      router.push("/login");
      return;
    }

    setError(null);
    setPagando(true);

    try {
      const tieneDivisionPorPlatos = cuentasPersonas.some((persona) => persona.comanda_id === comanda.id);
      const resultado = comanda.division_partes !== null && tieneDivisionPorPlatos
        ? await registrarPagoPersona({
            comandaId: comanda.id,
            personaId: personaCobrandoId ?? "",
            metodo: "efectivo",
            montoRecibido: recibido,
          })
        : await registrarPagoParcial({
            comandaId: comanda.id,
            monto: montoSiguienteParte,
            metodo: "efectivo",
            montoRecibido: recibido,
          });
      setDialogoPagoEfectivo(false);
      setMontoRecibido("");
      setPersonaCobrandoId(null);
      if (resultado.cerrada) {
        setDialogoDetalleCajero(false);
        setMesaDetalleCajero(null);
      }
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

  const abrirDialogoUnirMesas = () => {
    if (!puedeGestionarCaja) return;
    setError(null);
    setMesaPrincipalId("");
    setMesaSecundariaId("");
    setDialogoUnirMesas(true);
  };

  const unirMesas = async () => {
    if (!puedeGestionarCaja) return;
    if (!mesaPrincipalId || !mesaSecundariaId || mesaPrincipalId === mesaSecundariaId) {
      setError("Selecciona una mesa principal y otra mesa diferente.");
      return;
    }

    setError(null);
    setUniendoMesas(true);
    try {
      await unirMesasService(mesaPrincipalId, mesaSecundariaId);
      setDialogoUnirMesas(false);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron unir las mesas.");
    } finally {
      setUniendoMesas(false);
    }
  };

  const abrirDialogoDividirCuenta = () => {
    if (!puedeGestionarCaja || !comandaMesaCajero) return;
    setError(null);
    setDialogoDividirCuenta(true);
  };

  const configurarDivisionCuenta = async (
    numeroPersonas: number,
    asignaciones: AsignacionPlatoPersona[],
  ) => {
    if (!comandaMesaCajero) return;

    setError(null);
    setGuardando(true);
    try {
      await configurarDivisionCuentaService(
        comandaMesaCajero.id,
        numeroPersonas,
        asignaciones,
      );
      setDialogoDividirCuenta(false);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo dividir la cuenta.");
    } finally {
      setGuardando(false);
    }
  };

  const cerrarDetalleCajero = () => {
    if (pagando) {
      return;
    }

    setDialogoDetalleCajero(false);
    setMesaDetalleCajero(null);
    setPersonaCobrandoId(null);
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

    const mesaPrincipal = mesas.find(
      (actual) => actual.id === obtenerMesaPrincipalId(mesa.id),
    ) ?? mesa;

    setMesaSeleccionada(mesaPrincipal);
    setBusqueda("");

    const comanda =
      obtenerComandaMesa(mesa.id);

    if (!comanda) {
      setItemsSeleccionados([]);
      setDialogoAbierto(true);
      return;
    }

    if (comanda.division_partes !== null) {
      setError("La cuenta ya está dividida. El cajero debe completar primero los pagos por persona.");
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
    if (!esAdmin) {
      return;
    }

    setError(null);
    setNumeroMesa("");
    setDialogoCrearMesa(true);
  };

  const crearMesa = async () => {
    if (!esAdmin) {
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

    const usuario = await obtenerUsuarioAutenticado();

    if (!usuario) {
      router.push("/login");
      return;
    }

    const nombre = `Mesa ${normalizarNumeroMesa(numero)}`;
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
      const mesa = await crearMesaService(numero);

      setMesas((actuales) =>
        ordenarListaMesas([...actuales, mesa]),
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
    if (!esAdmin || !mesaEditando) {
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

    const usuario = await obtenerUsuarioAutenticado();

    if (!usuario) {
      router.push("/login");
      return;
    }

    const nombre = `Mesa ${normalizarNumeroMesa(numero)}`;
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
      const mesa = await editarMesaService(
        mesaEditando.id,
        numero,
      );

      setMesas((actuales) =>
        ordenarListaMesas(
          actuales.map((actual) =>
            actual.id === mesa.id ? mesa : actual,
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

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar ${mesa.nombre}?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmar) {
      return;
    }

    const usuario = await obtenerUsuarioAutenticado();

    if (!usuario) {
      router.push("/login");
      return;
    }

    setEliminandoMesa(true);
    setError(null);

    try {
      await eliminarMesaService(mesa.id);

      setMesas((actuales) =>
        actuales.filter((actual) => actual.id !== mesa.id),
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
      const resultado = await confirmarComandaService({
        mesaId: obtenerMesaPrincipalId(mesaSeleccionada.id),
        usuarioId: user.id,
        itemsSeleccionados,
        comandaExistente: obtenerComandaMesa(mesaSeleccionada.id),
      });

      if (resultado === "mesa_ocupada") {
        await cargarDatos();
        throw new Error(
          "Esta mesa acaba de ser ocupada por otro mesero.",
        );
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

    const comanda = obtenerComandaMesa(mesaSeleccionada.id);

    if (!comanda) {
      cerrarDialogo();
      return;
    }

    if (comanda.division_partes !== null) {
      setError("No se puede liberar una comanda después de dividir la cuenta.");
      return;
    }

    const confirmar = window.confirm(
      `¿Liberar ${mesaSeleccionada.nombre}?\n\nLa comanda actual se eliminará junto con sus productos y la mesa quedará libre.`,
    );

    if (!confirmar) {
      return;
    }

    const usuario = await obtenerUsuarioAutenticado();

    if (!usuario) {
      router.push("/login");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      await liberarComanda(comanda.id);

      setComandas((actuales) =>
        actuales.filter((actual) => actual.id !== comanda.id),
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

  return {
    mesas,
    platos,
    comandas,
    itemsComandas,
    pagos,
    cuentasPersonas,

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
    dialogoUnirMesas,
    mesaPrincipalId,
    mesaSecundariaId,
    uniendoMesas,
    dialogoDividirCuenta,
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
    totalPagadoMesaCajero,
    saldoPendienteMesaCajero,
    montoSiguienteParte,
    comandaMesaCajero,
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
    abrirDialogoUnirMesas,
    unirMesas,
    setMesaPrincipalId,
    setMesaSecundariaId,
    setDialogoUnirMesas,
    abrirDialogoDividirCuenta,
    configurarDivisionCuenta,
    setDialogoDividirCuenta,
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

    cerrarConfiguradorPlato,

    setBusqueda,
    setNumeroMesa,
    setDialogoCrearMesa,
    setDialogoEditarMesa,
    setDialogoArmarPlato,
    setObservacionesConfiguracion,
    setMesaEditando,
    
    obtenerItemsMesa,
    confirmarConfiguracionPlato,
    cargarDatos,
  };
}

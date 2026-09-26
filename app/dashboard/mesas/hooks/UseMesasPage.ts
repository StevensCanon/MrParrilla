"use client";

import {
  useCallback,
  useMemo,
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
} from "../services/mesas";
import {
  confirmarPagoEfectivo as confirmarPagoEfectivoService,
  confirmarPagoTransferencia as confirmarPagoTransferenciaService,
} from "../services/pagos";

import { CATEGORIAS } from "../constants/constants";

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
  generarUid,
  mesaEstaOcupada,
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

    const comanda = obtenerComandaMesa(mesaDetalleCajero.id);

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

    const usuario = await obtenerUsuarioAutenticado();

    if (!usuario) {
      router.push("/login");
      return;
    }

    setError(null);
    setPagando(true);

    try {
      await confirmarPagoTransferenciaService(comanda.id);
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

    if (recibido < totalMesaCajero) {
      setError(
        "El dinero recibido es insuficiente. Total: " + totalMesaCajero,
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
      await confirmarPagoEfectivoService(comanda.id, recibido);
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
        mesaId: mesaSeleccionada.id,
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
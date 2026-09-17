'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Plato = {
  id: string;
  nombre: string;
  categoria: string;
};

type Opcion = {
  id: string;
  nombre: string;
  recargo: number;
  stock_porciones: number | null;
};

type Grupo = {
  id: string;
  nombre: string;
  obligatorio: boolean;
  orden: number;
  opciones: Opcion[];
};

type ConfiguracionPlato = {
  plato: Plato;
  grupos: Grupo[];
  opcionesSeleccionadas: Record<string, string[]>;
};

type CrearMenuModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
  menuId?: string | null;
};

type NuevaOpcionForm = {
  grupoId: string;
  nombre: string;
  recargo: string;
  stock_porciones: string;
};

type MenuPlatoExistente = {
  id: string;
  plato_id: string;
  activo: boolean;
};

type MenuGrupoExistente = {
  id: string;
  menu_plato_id: string;
  grupo_id: string;
  activo: boolean;
  orden: number;
};

type MenuOpcionExistente = {
  id: string;
  menu_grupo_id: string;
  opcion_id: string;
  activo: boolean;
  orden: number;
  porciones_preparadas: number;
  porciones_reservadas: number;
  porciones_consumidas: number;
  agotado: boolean;
};

const PLATOS_PERMITIDOS = new Set([
  'Almuerzo Corriente',
  'Almuerzo Especial',
  'Almuerzo Ejecutivo',
  'Desayuno Completo',
  'Desayuno Moñona',
]);

function obtenerFechaColombia(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const valores: Record<string, string> = {};

  for (const parte of partes) {
    valores[parte.type] = parte.value;
  }

  return `${valores.year}-${valores.month}-${valores.day}`;
}

function formatearFecha(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString(
    'es-CO',
    {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );
}

export default function CrearMenuModal({
  open,
  onClose,
  onCreated,
  menuId = null,
}: CrearMenuModalProps) {
  const modoEdicion = Boolean(menuId);

  const fechaActual = useMemo(
    () => obtenerFechaColombia(),
    []
  );

  const [fechaMenu, setFechaMenu] = useState(fechaActual);

  const [platos, setPlatos] = useState<Plato[]>([]);
  const [configuraciones, setConfiguraciones] = useState<
    ConfiguracionPlato[]
  >([]);

  const [platoActivo, setPlatoActivo] = useState<string | null>(
    null
  );

  const [cargandoPlatos, setCargandoPlatos] = useState(false);
  const [cargandoMenu, setCargandoMenu] = useState(false);
  const [cargandoGrupos, setCargandoGrupos] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [nuevaOpcion, setNuevaOpcion] =
    useState<NuevaOpcionForm | null>(null);

  const [creandoOpcion, setCreandoOpcion] = useState(false);

  /*
   * ---------------------------------------------------------
   * LIMPIAR ESTADO
   * ---------------------------------------------------------
   */

  const limpiarEstado = () => {
    setConfiguraciones([]);
    setPlatoActivo(null);
    setError(null);
    setMensaje(null);
    setNuevaOpcion(null);
    setFechaMenu(fechaActual);
  };

  /*
   * ---------------------------------------------------------
   * CERRAR
   * ---------------------------------------------------------
   */

  const cerrarModal = () => {
    if (guardando || creandoOpcion) {
      return;
    }

    limpiarEstado();
    onClose();
  };

  /*
   * ---------------------------------------------------------
   * OBTENER GRUPOS Y OPCIONES DE UN PLATO
   * ---------------------------------------------------------
   */

  const obtenerGruposDelPlato = async (
    platoId: string
  ): Promise<Grupo[]> => {
    const { data, error: gruposError } = await supabase
      .from('menu_categorias_platos')
      .select(`
        id,
        nombre,
        obligatorio,
        orden,
        opciones_grupo (
          id,
          nombre,
          recargo,
          stock_porciones
        )
      `)
      .eq('plato_id', platoId)
      .order('orden', {
        ascending: true,
      });

    if (gruposError) {
      throw gruposError;
    }

    return (data ?? []).map((grupo) => ({
      id: grupo.id,
      nombre: grupo.nombre,
      obligatorio: Boolean(grupo.obligatorio),
      orden: Number(grupo.orden ?? 0),
      opciones: (grupo.opciones_grupo ?? []).map(
        (opcion) => ({
          id: opcion.id,
          nombre: opcion.nombre,
          recargo: Number(opcion.recargo ?? 0),
          stock_porciones:
            opcion.stock_porciones !== null &&
            opcion.stock_porciones !== undefined
              ? Number(opcion.stock_porciones)
              : null,
        })
      ),
    }));
  };

  /*
   * ---------------------------------------------------------
   * CARGAR CONFIGURACIÓN DE PLATO
   * ---------------------------------------------------------
   */

  const cargarConfiguracionPlato = async (
    plato: Plato,
    seleccionInicial?: Record<string, string[]>
  ) => {
    try {
      setCargandoGrupos(true);
      setError(null);

      const grupos = await obtenerGruposDelPlato(
        plato.id
      );

      const opcionesSeleccionadas: Record<
        string,
        string[]
      > = {
        ...(seleccionInicial ?? {}),
      };

      for (const grupo of grupos) {
        if (!opcionesSeleccionadas[grupo.id]) {
          opcionesSeleccionadas[grupo.id] = [];
        }
      }

      const configuracion: ConfiguracionPlato = {
        plato,
        grupos,
        opcionesSeleccionadas,
      };

      setConfiguraciones((prev) => {
        const existe = prev.some(
          (item) => item.plato.id === plato.id
        );

        if (existe) {
          return prev.map((item) =>
            item.plato.id === plato.id
              ? configuracion
              : item
          );
        }

        return [...prev, configuracion];
      });

      setPlatoActivo(plato.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar los grupos del plato.'
      );
    } finally {
      setCargandoGrupos(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * CARGAR MENÚ EXISTENTE
   *
   * IMPORTANTE:
   * Recibimos los platos directamente para no depender
   * del estado "platos" recién actualizado.
   * ---------------------------------------------------------
   */

  const cargarMenuExistente = async (
    id: string,
    platosDisponibles: Plato[]
  ) => {
    try {
      setCargandoMenu(true);
      setError(null);

      const {
        data: menu,
        error: menuError,
      } = await supabase
        .from('menus')
        .select('id, fecha, estado')
        .eq('id', id)
        .single();

      if (menuError) {
        throw menuError;
      }

      if (!menu) {
        throw new Error(
          'No fue posible encontrar el menú.'
        );
      }

      setFechaMenu(menu.fecha);

      const {
        data: menuPlatosData,
        error: menuPlatosError,
      } = await supabase
        .from('menu_platos')
        .select('id, plato_id, activo')
        .eq('menu_id', id);

      if (menuPlatosError) {
        throw menuPlatosError;
      }

      const menuPlatos =
        (menuPlatosData ??
          []) as MenuPlatoExistente[];

      const menuPlatosActivos =
        menuPlatos.filter(
          (item) => item.activo
        );

      const configuracionesCargadas: ConfiguracionPlato[] =
        [];

      for (const menuPlato of menuPlatosActivos) {
        const plato = platosDisponibles.find(
          (item) =>
            item.id === menuPlato.plato_id
        );

        if (!plato) {
          continue;
        }

        const {
          data: gruposData,
          error: gruposError,
        } = await supabase
          .from('menu_grupos')
          .select(
            'id, menu_plato_id, grupo_id, activo, orden'
          )
          .eq(
            'menu_plato_id',
            menuPlato.id
          );

        if (gruposError) {
          throw gruposError;
        }

        const gruposExistentes =
          (gruposData ??
            []) as MenuGrupoExistente[];

        const seleccionadas: Record<
          string,
          string[]
        > = {};

        for (const menuGrupo of gruposExistentes) {
          const {
            data: opcionesData,
            error: opcionesError,
          } = await supabase
            .from('menu_opciones')
            .select(`
              id,
              menu_grupo_id,
              opcion_id,
              activo,
              orden,
              porciones_preparadas,
              porciones_reservadas,
              porciones_consumidas,
              agotado
            `)
            .eq(
              'menu_grupo_id',
              menuGrupo.id
            );

          if (opcionesError) {
            throw opcionesError;
          }

          const opciones =
            (opcionesData ??
              []) as MenuOpcionExistente[];

          seleccionadas[
            menuGrupo.grupo_id
          ] = opciones
            .filter(
              (item) => item.activo
            )
            .sort(
              (a, b) =>
                a.orden - b.orden
            )
            .map(
              (item) =>
                item.opcion_id
            );
        }

        const grupos =
          await obtenerGruposDelPlato(
            plato.id
          );

        for (const grupo of grupos) {
          if (!seleccionadas[grupo.id]) {
            seleccionadas[grupo.id] = [];
          }
        }

        configuracionesCargadas.push({
          plato,
          grupos,
          opcionesSeleccionadas:
            seleccionadas,
        });
      }

      setConfiguraciones(
        configuracionesCargadas
      );

      if (
        configuracionesCargadas.length >
        0
      ) {
        setPlatoActivo(
          configuracionesCargadas[0].plato.id
        );
      } else {
        setPlatoActivo(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar la configuración del menú.'
      );
    } finally {
      setCargandoMenu(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * INICIALIZAR MODAL
   *
   * Antes había dos useEffect:
   *
   * 1. open -> cargarPlatos()
   * 2. platos -> cargarMenuExistente()
   *
   * Eso provocaba el warning de React.
   *
   * Ahora hacemos una sola operación de inicialización.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelado = false;

    const inicializarModal = async () => {
      try {
        setCargandoPlatos(true);
        setCargandoMenu(Boolean(menuId));
        setError(null);

        const {
          data,
          error: platosError,
        } = await supabase
          .from('platos')
          .select(
            'id, nombre, categoria'
          )
          .eq('disponible', true)
          .in(
            'nombre',
            Array.from(
              PLATOS_PERMITIDOS
            )
          )
          .order('nombre');

        if (platosError) {
          throw platosError;
        }

        if (cancelado) {
          return;
        }

        const platosCargados =
          (data ?? []).filter(
            (plato) =>
              PLATOS_PERMITIDOS.has(
                plato.nombre
              )
          );

        setPlatos(platosCargados);
        setCargandoPlatos(false);

        if (
          !menuId ||
          platosCargados.length === 0
        ) {
          setCargandoMenu(false);
          return;
        }

        await cargarMenuExistente(
          menuId,
          platosCargados
        );

        if (!cancelado) {
          setCargandoMenu(false);
        }
      } catch (err) {
        if (cancelado) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : 'No fue posible cargar los datos del menú.'
        );

        setCargandoPlatos(false);
        setCargandoMenu(false);
      }
    };

    void inicializarModal();

    return () => {
      cancelado = true;
    };
  }, [open, menuId]);

  /*
   * ---------------------------------------------------------
   * SELECCIONAR PLATO
   * ---------------------------------------------------------
   */

  const seleccionarPlato = async (
    plato: Plato
  ) => {
    setError(null);
    setNuevaOpcion(null);

    const configurado =
      configuraciones.find(
        (item) =>
          item.plato.id === plato.id
      );

    if (configurado) {
      setPlatoActivo(plato.id);
      return;
    }

    await cargarConfiguracionPlato(
      plato
    );
  };

  /*
   * ---------------------------------------------------------
   * ELIMINAR PLATO DE LA CONFIGURACIÓN
   * ---------------------------------------------------------
   */

  const eliminarPlato = (
    platoId: string
  ) => {
    setConfiguraciones((prev) =>
      prev.filter(
        (item) =>
          item.plato.id !== platoId
      )
    );

    if (platoActivo === platoId) {
      setPlatoActivo(null);
    }

    setNuevaOpcion(null);
  };

  /*
   * ---------------------------------------------------------
   * SELECCIONAR / DESELECCIONAR OPCIÓN
   * ---------------------------------------------------------
   */

  const seleccionarOpcion = (
    platoId: string,
    grupo: Grupo,
    opcionId: string
  ) => {
    setConfiguraciones((prev) =>
      prev.map((config) => {
        if (
          config.plato.id !== platoId
        ) {
          return config;
        }

        const actuales =
          config.opcionesSeleccionadas[
            grupo.id
          ] ?? [];

        const yaSeleccionada =
          actuales.includes(
            opcionId
          );

        let nuevasSeleccionadas: string[];

        if (yaSeleccionada) {
          if (
            grupo.obligatorio &&
            actuales.length === 1
          ) {
            return config;
          }

          nuevasSeleccionadas =
            actuales.filter(
              (id) =>
                id !== opcionId
            );
        } else {
          nuevasSeleccionadas = [
            ...actuales,
            opcionId,
          ];
        }

        return {
          ...config,
          opcionesSeleccionadas: {
            ...config.opcionesSeleccionadas,
            [grupo.id]:
              nuevasSeleccionadas,
          },
        };
      })
    );
  };

  /*
   * ---------------------------------------------------------
   * NUEVA OPCIÓN
   * ---------------------------------------------------------
   */

  const abrirNuevaOpcion = (
    grupoId: string
  ) => {
    setError(null);

    setNuevaOpcion({
      grupoId,
      nombre: '',
      recargo: '0',
      stock_porciones: '',
    });
  };

  const cerrarNuevaOpcion = () => {
    if (creandoOpcion) {
      return;
    }

    setNuevaOpcion(null);
  };

  /*
   * ---------------------------------------------------------
   * CREAR NUEVA OPCIÓN
   * ---------------------------------------------------------
   */

  const crearNuevaOpcion = async () => {
    if (
      !nuevaOpcion ||
      !platoActivo
    ) {
      return;
    }

    const nombre =
      nuevaOpcion.nombre.trim();

    if (!nombre) {
      setError(
        'Debes ingresar el nombre de la opción.'
      );
      return;
    }

    const recargo = Number(
      nuevaOpcion.recargo || 0
    );

    if (
      Number.isNaN(recargo) ||
      recargo < 0
    ) {
      setError(
        'El recargo debe ser un valor válido.'
      );
      return;
    }

    let stockPorciones:
      | number
      | null = null;

    if (
      nuevaOpcion.stock_porciones.trim() !==
      ''
    ) {
      const stock = Number(
        nuevaOpcion.stock_porciones
      );

      if (
        Number.isNaN(stock) ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        setError(
          'El stock de porciones debe ser un número entero igual o mayor a 0.'
        );
        return;
      }

      stockPorciones = stock;
    }

    try {
      setCreandoOpcion(true);
      setError(null);

      const {
        data: opcionExistente,
        error: buscarError,
      } = await supabase
        .from('opciones_grupo')
        .select(
          'id, nombre, recargo, stock_porciones'
        )
        .eq(
          'grupo_id',
          nuevaOpcion.grupoId
        )
        .ilike(
          'nombre',
          nombre
        )
        .maybeSingle();

      if (buscarError) {
        throw buscarError;
      }

      if (opcionExistente) {
        throw new Error(
          `Ya existe una opción llamada "${opcionExistente.nombre}" en este grupo.`
        );
      }

      const {
        data: nuevaOpcionCreada,
        error: crearError,
      } = await supabase
        .from('opciones_grupo')
        .insert({
          grupo_id:
            nuevaOpcion.grupoId,
          nombre,
          recargo,
          stock_porciones:
            stockPorciones,
        })
        .select(
          'id, nombre, recargo, stock_porciones'
        )
        .single();

      if (crearError) {
        throw crearError;
      }

      if (!nuevaOpcionCreada) {
        throw new Error(
          'No fue posible obtener la nueva opción creada.'
        );
      }

      const opcion: Opcion = {
        id: nuevaOpcionCreada.id,
        nombre:
          nuevaOpcionCreada.nombre,
        recargo: Number(
          nuevaOpcionCreada.recargo ??
            0
        ),
        stock_porciones:
          nuevaOpcionCreada.stock_porciones !==
            null &&
          nuevaOpcionCreada.stock_porciones !==
            undefined
            ? Number(
                nuevaOpcionCreada.stock_porciones
              )
            : null,
      };

      setConfiguraciones(
        (prev) =>
          prev.map((config) => {
            if (
              config.plato.id !==
              platoActivo
            ) {
              return config;
            }

            const opcionesActuales =
              config
                .opcionesSeleccionadas[
                nuevaOpcion.grupoId
              ] ?? [];

            return {
              ...config,

              grupos:
                config.grupos.map(
                  (grupo) => {
                    if (
                      grupo.id !==
                      nuevaOpcion.grupoId
                    ) {
                      return grupo;
                    }

                    return {
                      ...grupo,
                      opciones: [
                        ...grupo.opciones,
                        opcion,
                      ],
                    };
                  }
                ),

              opcionesSeleccionadas: {
                ...config.opcionesSeleccionadas,
                [nuevaOpcion.grupoId]: [
                  ...opcionesActuales,
                  opcion.id,
                ],
              },
            };
          })
      );

      setNuevaOpcion(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible crear la opción.'
      );
    } finally {
      setCreandoOpcion(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * VALIDAR
   * ---------------------------------------------------------
   */

  const validarConfiguracion =
    (): string | null => {
      if (
        configuraciones.length ===
        0
      ) {
        return 'Debes seleccionar al menos un plato.';
      }

      for (const configuracion of configuraciones) {
        for (const grupo of configuracion.grupos) {
          const seleccionadas =
            configuracion
              .opcionesSeleccionadas[
              grupo.id
            ] ?? [];

          if (
            grupo.obligatorio &&
            grupo.opciones.length >
              0 &&
            seleccionadas.length ===
              0
          ) {
            return `Debes seleccionar al menos una opción en "${grupo.nombre}" para ${configuracion.plato.nombre}.`;
          }
        }
      }

      return null;
    };

  /*
   * ---------------------------------------------------------
   * DESACTIVAR OPCIONES DE UN GRUPO
   * ---------------------------------------------------------
   */

  const desactivarOpcionesDelGrupo =
    async (
      menuGrupoId: string
    ) => {
      const { error } =
        await supabase
          .from('menu_opciones')
          .update({
            activo: false,
          })
          .eq(
            'menu_grupo_id',
            menuGrupoId
          );

      if (error) {
        throw error;
      }
    };

  /*
   * ---------------------------------------------------------
   * SINCRONIZAR UN GRUPO
   * ---------------------------------------------------------
   */

  const sincronizarGrupo = async (
    menuPlatoId: string,
    grupo: Grupo,
    seleccionadas: string[]
  ) => {
    const {
      data: grupoExistente,
      error: buscarGrupoError,
    } = await supabase
      .from('menu_grupos')
      .select(
        'id, menu_plato_id, grupo_id, activo, orden'
      )
      .eq(
        'menu_plato_id',
        menuPlatoId
      )
      .eq(
        'grupo_id',
        grupo.id
      )
      .maybeSingle();

    if (buscarGrupoError) {
      throw buscarGrupoError;
    }

    if (
      seleccionadas.length ===
      0
    ) {
      if (grupoExistente) {
        await desactivarOpcionesDelGrupo(
          grupoExistente.id
        );

        const { error } =
          await supabase
            .from('menu_grupos')
            .update({
              activo: false,
            })
            .eq(
              'id',
              grupoExistente.id
            );

        if (error) {
          throw error;
        }
      }

      return;
    }

    let menuGrupoId: string;

    if (grupoExistente) {
      menuGrupoId =
        grupoExistente.id;

      const { error } =
        await supabase
          .from('menu_grupos')
          .update({
            activo: true,
            orden: grupo.orden,
          })
          .eq(
            'id',
            menuGrupoId
          );

      if (error) {
        throw error;
      }
    } else {
      const {
        data: nuevoGrupo,
        error,
      } = await supabase
        .from('menu_grupos')
        .insert({
          menu_plato_id:
            menuPlatoId,
          grupo_id: grupo.id,
          activo: true,
          orden: grupo.orden,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      if (!nuevoGrupo) {
        throw new Error(
          `No se pudo crear el grupo "${grupo.nombre}".`
        );
      }

      menuGrupoId =
        nuevoGrupo.id;
    }

    const {
      data: opcionesExistentesData,
      error: opcionesError,
    } = await supabase
      .from('menu_opciones')
      .select(`
        id,
        menu_grupo_id,
        opcion_id,
        activo,
        orden,
        porciones_preparadas,
        porciones_reservadas,
        porciones_consumidas,
        agotado
      `)
      .eq(
        'menu_grupo_id',
        menuGrupoId
      );

    if (opcionesError) {
      throw opcionesError;
    }

    const opcionesExistentes =
      (opcionesExistentesData ??
        []) as MenuOpcionExistente[];

    for (
      let index = 0;
      index <
      seleccionadas.length;
      index += 1
    ) {
      const opcionId =
        seleccionadas[index];

      const existente =
        opcionesExistentes.find(
          (item) =>
            item.opcion_id ===
            opcionId
        );

      if (existente) {
        const { error } =
          await supabase
            .from('menu_opciones')
            .update({
              activo: true,
              orden: index,
            })
            .eq(
              'id',
              existente.id
            );

        if (error) {
          throw error;
        }
      } else {
        const { error } =
          await supabase
            .from('menu_opciones')
            .insert({
              menu_grupo_id:
                menuGrupoId,
              opcion_id:
                opcionId,
              activo: true,
              orden: index,
              porciones_preparadas: 0,
              porciones_reservadas: 0,
              porciones_consumidas: 0,
              agotado: false,
            });

        if (error) {
          throw error;
        }
      }
    }

    const seleccionadasSet =
      new Set(seleccionadas);

    for (const existente of opcionesExistentes) {
      if (
        !seleccionadasSet.has(
          existente.opcion_id
        )
      ) {
        const { error } =
          await supabase
            .from('menu_opciones')
            .update({
              activo: false,
            })
            .eq(
              'id',
              existente.id
            );

        if (error) {
          throw error;
        }
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * SINCRONIZAR PLATO
   * ---------------------------------------------------------
   */

  const sincronizarPlato = async (
    menuIdActual: string,
    configuracion: ConfiguracionPlato
  ) => {
    const {
      data: menuPlatoExistente,
      error: buscarError,
    } = await supabase
      .from('menu_platos')
      .select(
        'id, plato_id, activo'
      )
      .eq(
        'menu_id',
        menuIdActual
      )
      .eq(
        'plato_id',
        configuracion.plato.id
      )
      .maybeSingle();

    if (buscarError) {
      throw buscarError;
    }

    let menuPlatoId: string;

    if (menuPlatoExistente) {
      menuPlatoId =
        menuPlatoExistente.id;

      const { error } =
        await supabase
          .from('menu_platos')
          .update({
            activo: true,
          })
          .eq(
            'id',
            menuPlatoId
          );

      if (error) {
        throw error;
      }
    } else {
      const {
        data: nuevoMenuPlato,
        error,
      } = await supabase
        .from('menu_platos')
        .insert({
          menu_id:
            menuIdActual,
          plato_id:
            configuracion.plato.id,
          activo: true,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      if (!nuevoMenuPlato) {
        throw new Error(
          `No se pudo agregar "${configuracion.plato.nombre}" al menú.`
        );
      }

      menuPlatoId =
        nuevoMenuPlato.id;
    }

    for (const grupo of configuracion.grupos) {
      const seleccionadas =
        configuracion
          .opcionesSeleccionadas[
          grupo.id
        ] ?? [];

      await sincronizarGrupo(
        menuPlatoId,
        grupo,
        seleccionadas
      );
    }

    const {
      data: gruposExistentesData,
      error: gruposError,
    } = await supabase
      .from('menu_grupos')
      .select(
        'id, grupo_id, activo'
      )
      .eq(
        'menu_plato_id',
        menuPlatoId
      );

    if (gruposError) {
      throw gruposError;
    }

    const gruposActuales =
      new Set(
        configuracion.grupos.map(
          (grupo) => grupo.id
        )
      );

    for (
      const grupoExistente of
      gruposExistentesData ?? []
    ) {
      if (
        !gruposActuales.has(
          grupoExistente.grupo_id
        )
      ) {
        await desactivarOpcionesDelGrupo(
          grupoExistente.id
        );

        const { error } =
          await supabase
            .from('menu_grupos')
            .update({
              activo: false,
            })
            .eq(
              'id',
              grupoExistente.id
            );

        if (error) {
          throw error;
        }
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * CREAR / ACTUALIZAR MENÚ
   * ---------------------------------------------------------
   */

  const guardar = async () => {
    const errorValidacion =
      validarConfiguracion();

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      setMensaje(null);

      const {
        data: { user },
        error: usuarioError,
      } =
        await supabase.auth.getUser();

      if (usuarioError) {
        throw usuarioError;
      }

      if (!user) {
        throw new Error(
          'No hay un usuario autenticado.'
        );
      }

      let menuIdActual = menuId;

      if (!menuIdActual) {
        const {
          data: menuExistente,
          error: buscarMenuError,
        } = await supabase
          .from('menus')
          .select(
            'id, fecha, estado'
          )
          .eq(
            'fecha',
            fechaActual
          )
          .maybeSingle();

        if (buscarMenuError) {
          throw buscarMenuError;
        }

        if (menuExistente) {
          menuIdActual =
            menuExistente.id;
        } else {
          const {
            data: nuevoMenu,
            error: crearMenuError,
          } = await supabase
            .from('menus')
            .insert({
              fecha: fechaActual,
              estado: 'activo',
              creado_por: user.id,
            })
            .select(
              'id, fecha, estado'
            )
            .single();

          if (crearMenuError) {
            if (
              crearMenuError.code ===
              '23505'
            ) {
              const {
                data: menuRecuperado,
                error:
                  recuperarError,
              } =
                await supabase
                  .from('menus')
                  .select(
                    'id, fecha, estado'
                  )
                  .eq(
                    'fecha',
                    fechaActual
                  )
                  .single();

              if (recuperarError) {
                throw recuperarError;
              }

              menuIdActual =
                menuRecuperado.id;
            } else {
              throw crearMenuError;
            }
          } else {
            if (!nuevoMenu) {
              throw new Error(
                'No fue posible crear el menú.'
              );
            }

            menuIdActual =
              nuevoMenu.id;
          }
        }
      }

      if (!menuIdActual) {
        throw new Error(
          'No fue posible obtener el menú.'
        );
      }

      /*
       * Sincronizar platos actuales
       */

      for (const configuracion of configuraciones) {
        await sincronizarPlato(
          menuIdActual,
          configuracion
        );
      }

      /*
       * Desactivar platos eliminados
       */

      const {
        data:
          menuPlatosExistentesData,
        error: menuPlatosError,
      } = await supabase
        .from('menu_platos')
        .select(
          'id, plato_id, activo'
        )
        .eq(
          'menu_id',
          menuIdActual
        );

      if (menuPlatosError) {
        throw menuPlatosError;
      }

      const platosActuales =
        new Set(
          configuraciones.map(
            (configuracion) =>
              configuracion.plato.id
          )
        );

      for (
        const menuPlato of
        menuPlatosExistentesData ??
        []
      ) {
        if (
          !platosActuales.has(
            menuPlato.plato_id
          )
        ) {
          const {
            error:
              desactivarPlatoError,
          } = await supabase
            .from('menu_platos')
            .update({
              activo: false,
            })
            .eq(
              'id',
              menuPlato.id
            );

          if (desactivarPlatoError) {
            throw desactivarPlatoError;
          }

          const {
            data: gruposData,
            error: gruposError,
          } = await supabase
            .from('menu_grupos')
            .select('id')
            .eq(
              'menu_plato_id',
              menuPlato.id
            );

          if (gruposError) {
            throw gruposError;
          }

          for (const grupo of gruposData ??
            []) {
            await desactivarOpcionesDelGrupo(
              grupo.id
            );

            const { error } =
              await supabase
                .from('menu_grupos')
                .update({
                  activo: false,
                })
                .eq(
                  'id',
                  grupo.id
                );

            if (error) {
              throw error;
            }
          }
        }
      }

      setMensaje(
        modoEdicion
          ? 'El menú se actualizó correctamente.'
          : 'El menú se creó correctamente.'
      );

      await onCreated?.();

      setTimeout(() => {
        limpiarEstado();
        onClose();
      }, 350);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : modoEdicion
            ? 'No fue posible actualizar el menú.'
            : 'No fue posible crear el menú.'
      );
    } finally {
      setGuardando(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * PLATO SELECCIONADO
   * ---------------------------------------------------------
   */

  const platoSeleccionado =
    configuraciones.find(
      (item) =>
        item.plato.id ===
        platoActivo
    );

  /*
   * ---------------------------------------------------------
   * SI ESTÁ CERRADO
   * ---------------------------------------------------------
   */

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-5xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-zinc-200
          bg-white
          shadow-2xl
        "
      >
        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">
                {modoEdicion
                  ? 'Editar menú'
                  : 'Crear menú del día'}
              </h2>

              {modoEdicion && (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                  Edición
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              {modoEdicion
                ? 'Modifica los platos y opciones del menú sin perder la configuración existente.'
                : 'Configura los platos y opciones disponibles para hoy.'}
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            disabled={
              guardando ||
              creandoOpcion
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-zinc-400
              transition
              hover:bg-zinc-100
              hover:text-zinc-700
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* FECHA */}

        <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-white
                text-zinc-600
                shadow-sm
                ring-1
                ring-zinc-200
              "
            >
              📅
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Fecha del menú
              </p>

              <p className="text-sm font-medium capitalize text-zinc-800">
                {formatearFecha(
                  fechaMenu
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="shrink-0 border-b border-red-100 bg-red-50 px-6 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-sm text-red-500">
                ⚠
              </span>

              <p className="text-sm leading-5 text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  setError(null)
                }
                className="ml-auto text-xs text-red-400 hover:text-red-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* MENSAJE */}

        {mensaje && (
          <div className="shrink-0 border-b border-emerald-100 bg-emerald-50 px-6 py-3">
            <div className="flex items-center gap-3">
              <Check
                size={16}
                className="text-emerald-600"
              />

              <p className="text-sm text-emerald-700">
                {mensaje}
              </p>
            </div>
          </div>
        )}

        {/* CONTENIDO */}

        <div className="flex min-h-0 flex-1">
          {/* PLATOS */}

          <div className="flex w-[300px] shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/40 p-5">
            <div className="mb-4 shrink-0">
              <p className="text-sm font-semibold text-zinc-900">
                Platos del menú
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Selecciona los platos que estarán disponibles.
              </p>
            </div>

            {cargandoPlatos ||
            cargandoMenu ? (
              <div className="space-y-2 overflow-y-auto">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-[65px] animate-pulse rounded-xl bg-zinc-200"
                    />
                  )
                )}
              </div>
            ) : platos.length ===
              0 ? (
              <div className="overflow-y-auto">
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-5 text-center">
                  <p className="text-sm font-medium text-zinc-700">
                    No hay platos disponibles
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    No existen platos activos de tipo
                    Corriente, Especial, Ejecutivo
                    o Desayuno.
                  </p>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {platos.map(
                    (plato) => {
                      const configurado =
                        configuraciones.some(
                          (item) =>
                            item.plato.id ===
                            plato.id
                        );

                      const activo =
                        platoActivo ===
                        plato.id;

                      return (
                        <button
                          key={plato.id}
                          type="button"
                          onClick={() =>
                            void seleccionarPlato(
                              plato
                            )
                          }
                          disabled={
                            cargandoGrupos ||
                            guardando ||
                            creandoOpcion ||
                            cargandoMenu
                          }
                          className={`
                            flex
                            w-full
                            items-center
                            justify-between
                            rounded-xl
                            border
                            px-4
                            py-3
                            text-left
                            transition
                            disabled:cursor-not-allowed
                            ${
                              activo
                                ? 'border-zinc-900 bg-white shadow-sm'
                                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                            }
                          `}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-900">
                              {plato.nombre}
                            </p>

                            <p className="mt-0.5 text-xs capitalize text-zinc-400">
                              {plato.categoria}
                            </p>
                          </div>

                          {configurado && (
                            <span
                              className="
                                ml-3
                                shrink-0
                                rounded-full
                                bg-emerald-50
                                px-2
                                py-1
                                text-[10px]
                                font-semibold
                                text-emerald-600
                              "
                            >
                              Configurado
                            </span>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CONFIGURACIÓN */}

          <div className="min-w-0 flex-1 overflow-y-auto p-6">
            {!platoSeleccionado ? (
              <div className="flex h-full min-h-[350px] items-center justify-center">
                <div className="max-w-sm text-center">
                  <div
                    className="
                      mx-auto
                      mb-4
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-zinc-100
                      text-xl
                    "
                  >
                    🍽️
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-800">
                    Selecciona un plato
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Selecciona un plato de la izquierda
                    para configurar sus grupos y opciones.
                  </p>
                </div>
              </div>
            ) : cargandoGrupos ? (
              <div className="space-y-5">
                <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />

                <div className="h-40 animate-pulse rounded-xl bg-zinc-100" />

                <div className="h-40 animate-pulse rounded-xl bg-zinc-100" />
              </div>
            ) : (
              <>
                {/* TÍTULO */}

                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Configurando
                    </p>

                    <h3 className="mt-1 text-xl font-semibold text-zinc-900">
                      {
                        platoSeleccionado
                          .plato.nombre
                      }
                    </h3>

                    <p className="mt-1 text-xs capitalize text-zinc-400">
                      {
                        platoSeleccionado
                          .plato.categoria
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      guardando ||
                      creandoOpcion
                    }
                    onClick={() =>
                      eliminarPlato(
                        platoSeleccionado
                          .plato.id
                      )
                    }
                    className="
                      rounded-lg
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-red-500
                      transition
                      hover:bg-red-50
                      disabled:opacity-40
                    "
                  >
                    <Trash2
                      size={14}
                      className="mr-1.5 inline"
                    />
                    Quitar plato
                  </button>
                </div>

                {/* SIN GRUPOS */}

                {platoSeleccionado
                  .grupos.length ===
                0 ? (
                  <div
                    className="
                      rounded-xl
                      border
                      border-dashed
                      border-zinc-300
                      bg-zinc-50
                      p-8
                      text-center
                    "
                  >
                    <p className="text-sm font-medium text-zinc-700">
                      Este plato no tiene grupos configurados
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Debes configurar sus grupos y opciones
                      antes de incluirlo en un menú.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {platoSeleccionado.grupos.map(
                      (grupo) => {
                        const seleccionadas =
                          platoSeleccionado
                            .opcionesSeleccionadas[
                            grupo.id
                          ] ?? [];

                        const formularioAbierto =
                          nuevaOpcion?.grupoId ===
                          grupo.id;

                        return (
                          <div
                            key={grupo.id}
                            className="overflow-hidden rounded-xl border border-zinc-200"
                          >
                            {/* GRUPO */}

                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                border-b
                                border-zinc-200
                                bg-zinc-50
                                px-4
                                py-3
                              "
                            >
                              <div>
                                <p className="text-sm font-semibold text-zinc-800">
                                  {grupo.nombre}
                                </p>

                                <p className="mt-0.5 text-xs text-zinc-400">
                                  {grupo.obligatorio
                                    ? 'Selección obligatoria'
                                    : 'Selección opcional'}
                                </p>
                              </div>

                              <span className="text-xs text-zinc-400">
                                {
                                  seleccionadas.length
                                }{' '}
                                seleccionada
                                {seleccionadas.length !==
                                  1 &&
                                  's'}
                              </span>
                            </div>

                            {/* OPCIONES */}

                            <div className="p-3">
                              {grupo.opciones
                                .length ===
                              0 ? (
                                <div className="mb-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4">
                                  <p className="text-xs text-zinc-400">
                                    Este grupo todavía no tiene
                                    opciones.
                                  </p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {grupo.opciones.map(
                                    (opcion) => {
                                      const seleccionada =
                                        seleccionadas.includes(
                                          opcion.id
                                        );

                                      return (
                                        <button
                                          key={
                                            opcion.id
                                          }
                                          type="button"
                                          disabled={
                                            guardando ||
                                            creandoOpcion
                                          }
                                          onClick={() =>
                                            seleccionarOpcion(
                                              platoSeleccionado
                                                .plato
                                                .id,
                                              grupo,
                                              opcion.id
                                            )
                                          }
                                          className={`
                                            flex
                                            items-center
                                            gap-3
                                            rounded-lg
                                            border
                                            px-3
                                            py-2.5
                                            text-left
                                            transition
                                            disabled:cursor-not-allowed
                                            ${
                                              seleccionada
                                                ? 'border-zinc-900 bg-zinc-50'
                                                : 'border-zinc-200 hover:border-zinc-300'
                                            }
                                          `}
                                        >
                                          <span
                                            className={`
                                              flex
                                              h-4
                                              w-4
                                              shrink-0
                                              items-center
                                              justify-center
                                              rounded
                                              border
                                              text-[9px]
                                              ${
                                                seleccionada
                                                  ? 'border-zinc-900 bg-zinc-900 text-white'
                                                  : 'border-zinc-300 bg-white'
                                              }
                                            `}
                                          >
                                            {seleccionada && (
                                              <Check
                                                size={
                                                  10
                                                }
                                              />
                                            )}
                                          </span>

                                          <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm text-zinc-700">
                                              {
                                                opcion.nombre
                                              }
                                            </span>

                                            {opcion.recargo >
                                              0 && (
                                              <span className="mt-0.5 block text-[11px] text-zinc-400">
                                                +$
                                                {opcion.recargo.toLocaleString(
                                                  'es-CO'
                                                )}
                                              </span>
                                            )}
                                          </span>
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                              {/* AGREGAR OPCIÓN */}

                              {!formularioAbierto && (
                                <button
                                  type="button"
                                  disabled={
                                    guardando ||
                                    creandoOpcion
                                  }
                                  onClick={() =>
                                    abrirNuevaOpcion(
                                      grupo.id
                                    )
                                  }
                                  className="
                                    mt-3
                                    flex
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-lg
                                    border
                                    border-dashed
                                    border-zinc-300
                                    px-3
                                    py-2.5
                                    text-xs
                                    font-medium
                                    text-zinc-500
                                    transition
                                    hover:border-zinc-400
                                    hover:bg-zinc-50
                                    hover:text-zinc-700
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                  "
                                >
                                  <Plus size={14} />
                                  Agregar opción
                                </button>
                              )}

                              {/* NUEVA OPCIÓN */}

                              {formularioAbierto &&
                                nuevaOpcion && (
                                  <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                                    <div className="mb-4">
                                      <p className="text-sm font-semibold text-zinc-800">
                                        Nueva opción
                                      </p>

                                      <p className="mt-0.5 text-xs text-zinc-400">
                                        Esta opción quedará disponible
                                        para este grupo en futuros menús.
                                      </p>
                                    </div>

                                    <div className="space-y-3">
                                      {/* NOMBRE */}

                                      <div>
                                        <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                                          Nombre
                                        </label>

                                        <input
                                          type="text"
                                          autoFocus
                                          value={
                                            nuevaOpcion.nombre
                                          }
                                          onChange={(
                                            e
                                          ) =>
                                            setNuevaOpcion(
                                              (
                                                prev
                                              ) =>
                                                prev
                                                  ? {
                                                      ...prev,
                                                      nombre:
                                                        e
                                                          .target
                                                          .value,
                                                    }
                                                  : prev
                                            )
                                          }
                                          placeholder="Ej. Pechuga a la plancha"
                                          disabled={
                                            creandoOpcion
                                          }
                                          className="
                                            w-full
                                            rounded-lg
                                            border
                                            border-zinc-200
                                            bg-white
                                            px-3
                                            py-2.5
                                            text-sm
                                            text-zinc-800
                                            outline-none
                                            transition
                                            placeholder:text-zinc-300
                                            focus:border-zinc-400
                                            focus:ring-2
                                            focus:ring-zinc-100
                                          "
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {/* RECARGO */}

                                        <div>
                                          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                                            Recargo
                                          </label>

                                          <div className="relative">
                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                                              $
                                            </span>

                                            <input
                                              type="number"
                                              min="0"
                                              step="100"
                                              value={
                                                nuevaOpcion.recargo
                                              }
                                              onChange={(
                                                e
                                              ) =>
                                                setNuevaOpcion(
                                                  (
                                                    prev
                                                  ) =>
                                                    prev
                                                      ? {
                                                          ...prev,
                                                          recargo:
                                                            e
                                                              .target
                                                              .value,
                                                        }
                                                      : prev
                                                )
                                              }
                                              disabled={
                                                creandoOpcion
                                              }
                                              className="
                                                w-full
                                                rounded-lg
                                                border
                                                border-zinc-200
                                                bg-white
                                                py-2.5
                                                pl-7
                                                pr-3
                                                text-sm
                                                text-zinc-800
                                                outline-none
                                                transition
                                                focus:border-zinc-400
                                                focus:ring-2
                                                focus:ring-zinc-100
                                              "
                                            />
                                          </div>
                                        </div>

                                        {/* STOCK */}

                                        <div>
                                          <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                                            Stock de porciones
                                          </label>

                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={
                                              nuevaOpcion.stock_porciones
                                            }
                                            onChange={(
                                              e
                                            ) =>
                                              setNuevaOpcion(
                                                (
                                                  prev
                                                ) =>
                                                  prev
                                                    ? {
                                                        ...prev,
                                                        stock_porciones:
                                                          e
                                                            .target
                                                            .value,
                                                      }
                                                    : prev
                                              )
                                            }
                                            placeholder="Opcional"
                                            disabled={
                                              creandoOpcion
                                            }
                                            className="
                                              w-full
                                              rounded-lg
                                              border
                                              border-zinc-200
                                              bg-white
                                              px-3
                                              py-2.5
                                              text-sm
                                              text-zinc-800
                                              outline-none
                                              transition
                                              placeholder:text-zinc-300
                                              focus:border-zinc-400
                                              focus:ring-2
                                              focus:ring-zinc-100
                                            "
                                          />
                                        </div>
                                      </div>

                                      {/* BOTONES */}

                                      <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={
                                            cerrarNuevaOpcion
                                          }
                                          disabled={
                                            creandoOpcion
                                          }
                                          className="
                                            rounded-lg
                                            px-3
                                            py-2
                                            text-xs
                                            font-medium
                                            text-zinc-500
                                            transition
                                            hover:bg-white
                                            hover:text-zinc-700
                                          "
                                        >
                                          Cancelar
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            void crearNuevaOpcion()
                                          }
                                          disabled={
                                            creandoOpcion ||
                                            !nuevaOpcion.nombre.trim()
                                          }
                                          className="
                                            inline-flex
                                            items-center
                                            gap-2
                                            rounded-lg
                                            bg-zinc-900
                                            px-4
                                            py-2
                                            text-xs
                                            font-medium
                                            text-white
                                            transition
                                            hover:bg-zinc-800
                                            disabled:cursor-not-allowed
                                            disabled:opacity-40
                                          "
                                        >
                                          {creandoOpcion ? (
                                            <>
                                              <Loader2
                                                size={
                                                  13
                                                }
                                                className="animate-spin"
                                              />
                                              Agregando...
                                            </>
                                          ) : (
                                            <>
                                              <Plus
                                                size={
                                                  13
                                                }
                                              />
                                              Agregar opción
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-6 py-4">
          <p className="text-xs text-zinc-400">
            {configuraciones.length ===
            0
              ? 'No has seleccionado ningún plato'
              : `${configuraciones.length} plato${
                  configuraciones.length !==
                  1
                    ? 's'
                    : ''
                } configurado${
                  configuraciones.length !==
                  1
                    ? 's'
                    : ''
                }`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cerrarModal}
              disabled={
                guardando ||
                creandoOpcion
              }
              className="
                rounded-lg
                border
                border-zinc-200
                px-4
                py-2.5
                text-sm
                font-medium
                text-zinc-600
                transition
                hover:bg-zinc-50
                disabled:opacity-40
              "
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={
                guardando ||
                configuraciones.length ===
                  0 ||
                cargandoGrupos ||
                cargandoMenu ||
                creandoOpcion
              }
              onClick={() =>
                void guardar()
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-zinc-900
                px-5
                py-2.5
                text-sm
                font-medium
                text-white
                transition
                hover:bg-zinc-800
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              {guardando ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />

                  {modoEdicion
                    ? 'Guardando cambios...'
                    : 'Creando menú...'}
                </>
              ) : (
                <>
                  {modoEdicion ? (
                    <Save size={15} />
                  ) : (
                    <Plus size={15} />
                  )}

                  {modoEdicion
                    ? 'Guardar cambios'
                    : 'Crear menú'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
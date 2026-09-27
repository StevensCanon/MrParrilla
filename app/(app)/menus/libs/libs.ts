import { supabase } from '@/lib/supabaseClient';

import type {
  Menu,
  MenuDetalle,
  MenuPlato,
  MenuPlatoDetalle,
  OpcionDetalle,
  GrupoDetalle,
} from '../types/types';

import { ordenarPorTipoDePlato } from '../utils/utils';

type MenuPlatoQuery = {
  id: string;
  plato_id: string;
  activo: boolean;
  platos:
    | {
        id: string;
        nombre: string;
        categoria: string;
      }
    | {
        id: string;
        nombre: string;
        categoria: string;
      }[]
    | null;
};

function normalizarPlato(
  plato: MenuPlatoQuery['platos']
): MenuPlato['platos'] {
  if (Array.isArray(plato)) {
    return plato[0] ?? null;
  }

  return plato;
}

export async function cargarMenus(): Promise<Menu[]> {
  const { data, error } = await supabase
    .from('menus')
    .select(`
      id,
      fecha,
      estado,
      creado_en,
      menu_platos (
        id,
        plato_id,
        activo,
        platos (
          id,
          nombre,
          categoria
        )
      )
    `)
    .order('fecha', { ascending: false });

  if (error) {
    throw error;
  }

  const menusCargados: Menu[] = (data ?? []).map((menu) => ({
    id: menu.id,
    fecha: menu.fecha,
    estado: menu.estado,
    creado_en: menu.creado_en,
    menu_platos: (
      (menu.menu_platos ?? []) as MenuPlatoQuery[]
    ).map((menuPlato) => ({
      id: menuPlato.id,
      plato_id: menuPlato.plato_id,
      activo: menuPlato.activo,
      platos: normalizarPlato(menuPlato.platos),
    })),
  }));

  return menusCargados.map((menu) => ({
    ...menu,
    menu_platos: ordenarPorTipoDePlato(menu.menu_platos),
  }));
}

export async function cargarMenuDetalle(
  menu: Menu
): Promise<MenuDetalle> {
  const { data: menuPlatosData, error: menuPlatosError } =
    await supabase
      .from('menu_platos')
      .select(`
        id,
        plato_id,
        activo,
        platos (
          id,
          nombre,
          categoria
        )
      `)
      .eq('menu_id', menu.id)
      .order('id', { ascending: true });

  if (menuPlatosError) {
    throw menuPlatosError;
  }

  const menuPlatos: MenuPlato[] = (
    (menuPlatosData ?? []) as MenuPlatoQuery[]
  ).map((item) => ({
    id: item.id,
    plato_id: item.plato_id,
    activo: item.activo,
    platos: normalizarPlato(item.platos),
  }));

  const menuPlatosOrdenados = ordenarPorTipoDePlato(
    menuPlatos.filter((menuPlato) => menuPlato.activo)
  );

  const platosDetalle: MenuPlatoDetalle[] = await Promise.all(
    menuPlatosOrdenados.map(async (menuPlato) => {
      const { data: gruposData, error: gruposError } =
        await supabase
          .from('menu_grupos')
          .select(`
            id,
            menu_plato_id,
            grupo_id,
            activo,
            orden,
            menu_categorias_platos (
              id,
              nombre,
              obligatorio,
              orden
            )
          `)
          .eq('menu_plato_id', menuPlato.id)
          .eq('activo', true)
          .order('orden', { ascending: true });

      if (gruposError) {
        throw gruposError;
      }

      const gruposDetalle: GrupoDetalle[] = await Promise.all(
        (gruposData ?? []).map(async (menuGrupo) => {
          const grupoOriginal = Array.isArray(
            menuGrupo.menu_categorias_platos
          )
            ? menuGrupo.menu_categorias_platos[0]
            : menuGrupo.menu_categorias_platos;

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
              agotado,
              opciones_grupo (
                id,
                nombre,
                recargo,
                stock_porciones
              )
            `)
            .eq('menu_grupo_id', menuGrupo.id)
            .eq('activo', true)
            .order('orden', { ascending: true });

          if (opcionesError) {
            throw opcionesError;
          }

          const opciones: OpcionDetalle[] = (
            opcionesData ?? []
          ).map((menuOpcion) => {
            const opcionOriginal = Array.isArray(
              menuOpcion.opciones_grupo
            )
              ? menuOpcion.opciones_grupo[0]
              : menuOpcion.opciones_grupo;

            return {
              id: menuOpcion.id,
              nombre:
                opcionOriginal?.nombre ?? 'Opción eliminada',
              recargo: Number(opcionOriginal?.recargo ?? 0),
              stock_porciones:
                opcionOriginal?.stock_porciones !== null &&
                opcionOriginal?.stock_porciones !== undefined
                  ? Number(opcionOriginal.stock_porciones)
                  : null,
              activo: menuOpcion.activo,
              orden: menuOpcion.orden,
              porciones_preparadas:
                menuOpcion.porciones_preparadas ?? 0,
              porciones_reservadas:
                menuOpcion.porciones_reservadas ?? 0,
              porciones_consumidas:
                menuOpcion.porciones_consumidas ?? 0,
              agotado: menuOpcion.agotado ?? false,
            };
          });

          return {
            id: menuGrupo.id,
            nombre: grupoOriginal?.nombre ?? 'Grupo eliminado',
            obligatorio: grupoOriginal?.obligatorio ?? false,
            orden:
              grupoOriginal?.orden ??
              menuGrupo.orden ??
              0,
            opciones,
          };
        })
      );

      return {
        id: menuPlato.id,
        plato_id: menuPlato.plato_id,
        activo: menuPlato.activo,
        plato: menuPlato.platos,
        grupos: gruposDetalle,
      };
    })
  );

  return {
    id: menu.id,
    fecha: menu.fecha,
    estado: menu.estado,
    creado_en: menu.creado_en,
    platos: platosDetalle,
  };
}

export async function eliminarMenu(
  menuId: string
): Promise<void> {
  const { data: menuPlatosData, error: menuPlatosError } =
    await supabase
      .from('menu_platos')
      .select('id')
      .eq('menu_id', menuId);

  if (menuPlatosError) {
    throw menuPlatosError;
  }

  const menuPlatoIds = (menuPlatosData ?? []).map(
    (item) => item.id
  );

  if (menuPlatoIds.length === 0) {
    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', menuId);

    if (error) {
      throw error;
    }

    return;
  }

  const { data: menuGruposData, error: menuGruposError } =
    await supabase
      .from('menu_grupos')
      .select('id')
      .in('menu_plato_id', menuPlatoIds);

  if (menuGruposError) {
    throw menuGruposError;
  }

  const menuGrupoIds = (menuGruposData ?? []).map(
    (item) => item.id
  );

  let menuOpcionIds: string[] = [];

  if (menuGrupoIds.length > 0) {
    const {
      data: menuOpcionesData,
      error: menuOpcionesError,
    } = await supabase
      .from('menu_opciones')
      .select('id')
      .in('menu_grupo_id', menuGrupoIds);

    if (menuOpcionesError) {
      throw menuOpcionesError;
    }

    menuOpcionIds = (menuOpcionesData ?? []).map(
      (item) => item.id
    );
  }

  if (menuOpcionIds.length > 0) {
    const {
      data: reservasData,
      error: reservasError,
    } = await supabase
      .from('reservas_menu_opciones')
      .select('id')
      .in('menu_opcion_id', menuOpcionIds)
      .limit(1);

    if (reservasError) {
      throw reservasError;
    }

    if ((reservasData ?? []).length > 0) {
      throw new Error(
        'No se puede eliminar este menú porque una o más opciones ya tienen reservas asociadas a pedidos.'
      );
    }

    const {
      data: comandaItemsData,
      error: comandaItemsError,
    } = await supabase
      .from('comanda_items')
      .select('id')
      .in('menu_opcion_id', menuOpcionIds)
      .limit(1);

    if (comandaItemsError) {
      throw comandaItemsError;
    }

    if ((comandaItemsData ?? []).length > 0) {
      throw new Error(
        'No se puede eliminar este menú porque una o más opciones ya están asociadas a pedidos.'
      );
    }
  }

  if (menuOpcionIds.length > 0) {
    const { error } = await supabase
      .from('menu_opciones')
      .delete()
      .in('id', menuOpcionIds);

    if (error) {
      throw error;
    }
  }

  if (menuGrupoIds.length > 0) {
    const { error } = await supabase
      .from('menu_grupos')
      .delete()
      .in('id', menuGrupoIds);

    if (error) {
      throw error;
    }
  }

  const { error: deletePlatosError } = await supabase
    .from('menu_platos')
    .delete()
    .in('id', menuPlatoIds);

  if (deletePlatosError) {
    throw deletePlatosError;
  }

  const { error: deleteMenuError } = await supabase
    .from('menus')
    .delete()
    .eq('id', menuId);

  if (deleteMenuError) {
    throw deleteMenuError;
  }
}
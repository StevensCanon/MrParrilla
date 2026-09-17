import { supabase } from "@/lib/supabaseClient";

import type {
  Comanda,
  ComandaCocina,
  ComandaItem,
  GrupoOpcion,
  ItemCocina,
  MenuGrupo,
  MenuOpcion,
  Mesa,
  OpcionCocina,
  OpcionGrupo,
  Plato,
} from "../types/types";

export async function cargarComandasCocina(): Promise<
  ComandaCocina[]
> {
  const { data: comandasData, error: comandasError } =
    await supabase
      .from("comandas")
      .select(
        "id, canal, mesa_id, mesero_id, estado, abierta_en, archivada",
      )
      .eq("estado", "abierta")
      .eq("archivada", false)
      .order("abierta_en", { ascending: true });

  if (comandasError) {
    throw new Error(comandasError.message);
  }

  const comandas = (comandasData ?? []) as Comanda[];

  if (comandas.length === 0) {
    return [];
  }

  const comandaIds = comandas.map((comanda) => comanda.id);

  const mesaIds = Array.from(
    new Set(
      comandas
        .map((comanda) => comanda.mesa_id)
        .filter((id): id is string => id !== null),
    ),
  );

  const { data: mesasData, error: mesasError } =
    mesaIds.length > 0
      ? await supabase
          .from("mesas")
          .select("id, nombre")
          .in("id", mesaIds)
      : { data: [], error: null };

  if (mesasError) {
    throw new Error(mesasError.message);
  }

  const mesas = (mesasData ?? []) as Mesa[];

  const { data: itemsData, error: itemsError } =
    await supabase
      .from("comanda_items")
      .select(
        `
        id,
        comanda_id,
        plato_id,
        item_padre_id,
        opcion_id,
        menu_opcion_id,
        cantidad,
        observaciones,
        precio_unitario,
        estado
        `,
      )
      .in("comanda_id", comandaIds)
      .order("creado_en", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const items = (itemsData ?? []) as ComandaItem[];

  if (items.length === 0) {
    return comandas.map((comanda) => ({
      ...comanda,
      mesa:
        mesas.find((mesa) => mesa.id === comanda.mesa_id) ??
        null,
      items: [],
    }));
  }

  const itemsPadre = items.filter(
    (item) => item.item_padre_id === null,
  );

  const itemsHijo = items.filter(
    (item) => item.item_padre_id !== null,
  );

  const platoIds = Array.from(
    new Set(
      items.map((item) => item.plato_id).filter(Boolean),
    ),
  );

  const opcionIds = Array.from(
    new Set(
      itemsHijo
        .map((item) => item.opcion_id)
        .filter((id): id is string => id !== null),
    ),
  );

  const menuOpcionIds = Array.from(
    new Set(
      itemsHijo
        .map((item) => item.menu_opcion_id)
        .filter((id): id is string => id !== null),
    ),
  );

  const { data: platosData, error: platosError } =
    platoIds.length > 0
      ? await supabase
          .from("platos")
          .select("id, nombre, categoria")
          .in("id", platoIds)
      : { data: [], error: null };

  if (platosError) {
    throw new Error(platosError.message);
  }

  const platos = (platosData ?? []) as Plato[];

  const { data: opcionesData, error: opcionesError } =
    opcionIds.length > 0
      ? await supabase
          .from("opciones_grupo")
          .select("id, nombre")
          .in("id", opcionIds)
      : { data: [], error: null };

  if (opcionesError) {
    throw new Error(opcionesError.message);
  }

  const opciones = (opcionesData ?? []) as OpcionGrupo[];

  const { data: menuOpcionesData, error: menuOpcionesError } =
    menuOpcionIds.length > 0
      ? await supabase
          .from("menu_opciones")
          .select("id, menu_grupo_id, opcion_id")
          .in("id", menuOpcionIds)
      : { data: [], error: null };

  if (menuOpcionesError) {
    throw new Error(menuOpcionesError.message);
  }

  const menuOpciones =
    (menuOpcionesData ?? []) as MenuOpcion[];

  const menuGrupoIds = Array.from(
    new Set(
      menuOpciones
        .map((item) => item.menu_grupo_id)
        .filter(Boolean),
    ),
  );

  const { data: menuGruposData, error: menuGruposError } =
    menuGrupoIds.length > 0
      ? await supabase
          .from("menu_grupos")
          .select("id, grupo_id")
          .in("id", menuGrupoIds)
      : { data: [], error: null };

  if (menuGruposError) {
    throw new Error(menuGruposError.message);
  }

  const menuGrupos = (menuGruposData ?? []) as MenuGrupo[];

  const grupoIds = Array.from(
    new Set(
      menuGrupos
        .map((grupo) => grupo.grupo_id)
        .filter(Boolean),
    ),
  );

  const { data: gruposData, error: gruposError } =
    grupoIds.length > 0
      ? await supabase
          .from("menu_categorias_platos")
          .select("id, nombre")
          .in("id", grupoIds)
      : { data: [], error: null };

  if (gruposError) {
    throw new Error(gruposError.message);
  }

  const grupos = (gruposData ?? []) as GrupoOpcion[];

  const mesasMap = new Map(
    mesas.map((mesa) => [mesa.id, mesa]),
  );

  const platosMap = new Map(
    platos.map((plato) => [plato.id, plato]),
  );

  const opcionesMap = new Map(
    opciones.map((opcion) => [opcion.id, opcion]),
  );

  const menuOpcionesMap = new Map(
    menuOpciones.map((opcion) => [
      opcion.id,
      opcion,
    ]),
  );

  const menuGruposMap = new Map(
    menuGrupos.map((grupo) => [
      grupo.id,
      grupo,
    ]),
  );

  const gruposMap = new Map(
    grupos.map((grupo) => [
      grupo.id,
      grupo,
    ]),
  );

  function construirOpciones(
    itemPadreId: string,
  ): OpcionCocina[] {
    return itemsHijo
      .filter(
        (item) => item.item_padre_id === itemPadreId,
      )
      .map((item) => {
        const menuOpcion = item.menu_opcion_id
          ? menuOpcionesMap.get(item.menu_opcion_id)
          : undefined;

        const menuGrupo = menuOpcion
          ? menuGruposMap.get(menuOpcion.menu_grupo_id)
          : undefined;

        const grupo = menuGrupo
          ? gruposMap.get(menuGrupo.grupo_id)
          : undefined;

        const opcion = item.opcion_id
          ? opcionesMap.get(item.opcion_id)
          : undefined;

        return {
          menu_opcion_id: item.menu_opcion_id,
          opcion_id: item.opcion_id,
          grupo_id: grupo?.id ?? null,
          grupo_nombre:
            grupo?.nombre ?? "Opción",
          nombre:
            opcion?.nombre ??
            "Opción seleccionada",
        };
      });
  }

  return comandas.map((comanda) => {
    const itemsComanda = itemsPadre
      .filter(
        (item) => item.comanda_id === comanda.id,
      )
      .map<ItemCocina>((item) => ({
        ...item,
        plato:
          platosMap.get(item.plato_id) ??
          null,
        opciones: construirOpciones(item.id),
      }));

    return {
      ...comanda,
      mesa:
        mesasMap.get(comanda.mesa_id ?? "") ??
        null,
      items: itemsComanda,
    };
  });
}

export async function actualizarEstadoItem(
  itemId: string,
  nuevoEstado: "preparando" | "listo",
): Promise<void> {
  const { error } = await supabase
    .from("comanda_items")
    .update({
      estado: nuevoEstado,
    })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function archivarComanda(
  comandaId: string,
): Promise<void> {
  const { error } = await supabase
    .from("comandas")
    .update({
      archivada: true,
    })
    .eq("id", comandaId);

  if (error) {
    throw new Error(error.message);
  }
}
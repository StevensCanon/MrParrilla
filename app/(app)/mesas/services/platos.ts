import { supabase } from "@/lib/supabaseClient";
import type {
  ConfiguracionPlato,
  Plato,
} from "../types/types";
import {
  esGrupoCaldosYSopas,
  obtenerFechaColombia,
} from "../utils/utils";

export async function cargarConfiguracionPlato(
  plato: Plato,
): Promise<ConfiguracionPlato | null> {
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
}

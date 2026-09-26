import { supabase } from "@/lib/supabaseClient";

import {
  CANAL_COMANDA,
  ESTADO_COMANDA,
} from "../constants/constants";

import type {
  Comanda,
  ComandaItem,
  ItemSeleccionado,
  Plato,
} from "../types/types";

import {
  generarUid,
  obtenerOpcionesItem,
} from "../utils/utils";

type ConfirmarComandaParams = {
  mesaId: string;
  usuarioId: string;
  itemsSeleccionados: ItemSeleccionado[];
  comandaExistente: Comanda | null;
};

export async function cargarItemsComanda(
  comandaId: string,
  platos: Plato[],
): Promise<ItemSeleccionado[]> {
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
}

export async function confirmarComanda({
  mesaId,
  usuarioId,
  itemsSeleccionados,
  comandaExistente,
}: ConfirmarComandaParams): Promise<"mesa_ocupada" | void> {
        let comanda = comandaExistente;

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
                mesaId,
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
              return "mesa_ocupada";
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
}

export async function liberarComanda(comandaId: string): Promise<void> {
  const { error: errorItems } = await supabase
    .from("comanda_items")
    .delete()
    .eq("comanda_id", comandaId);

  if (errorItems) {
    throw new Error(errorItems.message);
  }

  const { error: errorComanda } = await supabase
    .from("comandas")
    .delete()
    .eq("id", comandaId);

  if (errorComanda) {
    throw new Error(errorComanda.message);
  }
}

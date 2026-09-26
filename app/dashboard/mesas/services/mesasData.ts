import { supabase } from "@/lib/supabaseClient";
import type { Comanda, ComandaItem, Mesa, Plato } from "../types/types";
import { ESTADO_COMANDA } from "../constants/constants";
import { ordenarMesas } from "../utils/utils";

export type DatosMesas = {
  mesas: Mesa[];
  platos: Plato[];
  comandas: Comanda[];
  itemsComandas: ComandaItem[];
};

export async function cargarDatosMesas(): Promise<DatosMesas> {
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
      .eq("estado", ESTADO_COMANDA.ABIERTA)
      .not("mesa_id", "is", null),
  ]);

  if (mesasError) throw new Error(mesasError.message);
  if (platosError) throw new Error(platosError.message);
  if (comandasError) throw new Error(comandasError.message);

  const comandas = (comandasData as Comanda[]) ?? [];

  if (comandas.length === 0) {
    return {
      mesas: ordenarMesas((mesasData as Mesa[]) ?? []),
      platos: (platosData as Plato[]) ?? [],
      comandas: [],
      itemsComandas: [],
    };
  }

  const idsComandas = comandas.map((comanda) => comanda.id);

  const { data: itemsData, error: itemsError } = await supabase
    .from("comanda_items")
    .select(
      "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
    )
    .in("comanda_id", idsComandas)
    .order("creado_en", { ascending: true });

  if (itemsError) throw new Error(itemsError.message);

  return {
    mesas: ordenarMesas((mesasData as Mesa[]) ?? []),
    platos: (platosData as Plato[]) ?? [],
    comandas,
    itemsComandas: (itemsData as ComandaItem[]) ?? [],
  };
}

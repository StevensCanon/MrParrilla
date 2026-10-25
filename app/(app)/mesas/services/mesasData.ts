import { supabase } from "@/lib/supabaseClient";
import type {
  Comanda,
  ComandaItem,
  CuentaPersona,
  CuentaPersonaItem,
  Mesa,
  PagoMesa,
  Plato,
} from "../types/types";
import { ESTADO_COMANDA } from "../constants/constants";
import { ordenarMesas } from "../utils/utils";

export type DatosMesas = {
  mesas: Mesa[];
  platos: Plato[];
  comandas: Comanda[];
  itemsComandas: ComandaItem[];
  pagos: PagoMesa[];
  cuentasPersonas: CuentaPersona[];
};

export async function cargarDatosMesas(): Promise<DatosMesas> {
  const [
    { data: mesasData, error: mesasError },
    { data: platosData, error: platosError },
    { data: comandasData, error: comandasError },
  ] = await Promise.all([
    supabase
      .from("mesas")
      .select("id, nombre, activa, unida_a")
      .eq("activa", true)
      .order("nombre", { ascending: true }),
    supabase
      .from("platos")
      .select("id, nombre, categoria, precio, disponible")
      .order("categoria", { ascending: true })
      .order("nombre", { ascending: true }),
    supabase
      .from("comandas")
      .select("id, mesa_id, mesero_id, estado, division_partes, division_partes_pagadas")
      .eq("estado", ESTADO_COMANDA.ABIERTA)
      .not("mesa_id", "is", null),
  ]);

  if (mesasError) throw new Error(`No se pudieron cargar las mesas: ${mesasError.message}`);
  if (platosError) throw new Error(`No se pudieron cargar los platos: ${platosError.message}`);
  if (comandasError) throw new Error(`No se pudieron cargar las comandas: ${comandasError.message}`);

  const comandas = (comandasData as Comanda[]) ?? [];

  if (comandas.length === 0) {
    return {
      mesas: ordenarMesas((mesasData as Mesa[]) ?? []),
      platos: (platosData as Plato[]) ?? [],
      comandas: [],
      itemsComandas: [],
      pagos: [],
      cuentasPersonas: [],
    };
  }

  const idsComandas = comandas.map((comanda) => comanda.id);

  const [
    { data: itemsData, error: itemsError },
    { data: pagosData, error: pagosError },
  ] = await Promise.all([
    supabase
      .from("comanda_items")
      .select(
        "id, comanda_id, plato_id, item_padre_id, opcion_id, cantidad, precio_unitario, estado, observaciones, menu_opcion_id",
      )
      .in("comanda_id", idsComandas)
      .order("creado_en", { ascending: true }),
    supabase
      .from("pagos")
      .select("id, comanda_id, monto, estado")
      .in("comanda_id", idsComandas)
      .eq("estado", "confirmado"),
  ]);

  if (itemsError) throw new Error(itemsError.message);
  if (pagosError) throw new Error(pagosError.message);

  const { data: personasData, error: personasError } = await supabase
    .from("comanda_personas")
    .select("id, comanda_id, numero, monto_total, pagada")
    .in("comanda_id", idsComandas)
    .order("numero", { ascending: true });

  if (personasError) {
    throw new Error(`No se pudieron cargar las cuentas divididas: ${personasError.message}`);
  }

  const personas = (personasData ?? []) as Omit<CuentaPersona, "items">[];
  let itemsPersonas: CuentaPersonaItem[] = [];

  if (personas.length > 0) {
    const { data, error } = await supabase
      .from("comanda_persona_items")
      .select("id, persona_id, comanda_item_id, cantidad")
      .in("persona_id", personas.map((persona) => persona.id));

    if (error) {
      throw new Error(`No se pudieron cargar los platos asignados: ${error.message}`);
    }

    itemsPersonas = (data ?? []) as CuentaPersonaItem[];
  }

  const cuentasPersonas: CuentaPersona[] = personas.map((persona) => ({
    ...persona,
    monto_total: Number(persona.monto_total),
    pagada: Boolean(persona.pagada),
    items: itemsPersonas.filter((item) => item.persona_id === persona.id),
  }));

  return {
    mesas: ordenarMesas((mesasData as Mesa[]) ?? []),
    platos: (platosData as Plato[]) ?? [],
    comandas,
    itemsComandas: (itemsData as ComandaItem[]) ?? [],
    pagos: (pagosData as PagoMesa[]) ?? [],
    cuentasPersonas,
  };
}

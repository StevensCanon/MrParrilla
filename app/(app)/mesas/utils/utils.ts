import type {
    Comanda,
    ComandaItem,
    ItemSeleccionado,
    Mesa,
    OpcionSeleccionada,
  } from "../types/types";
  
  export const money = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Math.round(Number(value) || 0));
  
  export const generarUid = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  export const obtenerFechaColombia = () => {
    const partes = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
  
    const year = partes.find((parte) => parte.type === "year")?.value;
    const month = partes.find((parte) => parte.type === "month")?.value;
    const day = partes.find((parte) => parte.type === "day")?.value;
  
    return `${year}-${month}-${day}`;
  };
  
  export const ordenarMesas = (mesas: Mesa[]) =>
    [...mesas].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, undefined, {
        numeric: true,
      }),
    );
  
  export const esGrupoCaldosYSopas = (nombre: string) => {
    const nombreNormalizado = nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  
    return (
      nombreNormalizado.includes("caldos") &&
      nombreNormalizado.includes("sopas")
    );
  };
  
  export const calcularTotalComanda = (
    items: ComandaItem[],
    comandaId: string,
  ) =>
    items
      .filter(
        (item) =>
          item.comanda_id === comandaId &&
          item.item_padre_id === null,
      )
      .reduce(
        (total, item) =>
          total +
          Number(item.precio_unitario) * Number(item.cantidad),
        0,
      );
  
  export const calcularTotalSeleccion = (
    items: ItemSeleccionado[],
  ) =>
    items.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0,
    );
  
  export const buscarComandaMesa = (
    comandas: Comanda[],
    mesaId: string,
  ) =>
    comandas.find(
      (comanda) =>
        comanda.mesa_id === mesaId &&
        comanda.estado === "abierta",
    ) ?? null;
  
  export const mesaEstaOcupada = (
    comandas: Comanda[],
    mesaId: string,
  ) =>
    comandas.some(
      (comanda) =>
        comanda.mesa_id === mesaId &&
        comanda.estado === "abierta",
    );
  
  export const obtenerNumeroMesa = (nombre: string) =>
    nombre.replace(/^mesa\s*/i, "");
  
  export const normalizarNumeroMesa = (numero: string) =>
    String(Number(numero.trim()));
  
  export const obtenerOpcionesItem = (
    item: ComandaItem,
    hijos: ComandaItem[],
    opcionesMap: Map<
      string,
      {
        id: string;
        nombre: string;
        recargo: number;
      }
    >,
    menuOpcionesMap: Map<
      string,
      {
        id: string;
        menu_grupo_id: string;
      }
    >,
    menuGruposMap: Map<
      string,
      {
        id: string;
        grupo_id: string;
      }
    >,
    gruposMap: Map<
      string,
      {
        id: string;
        nombre: string;
      }
    >,
  ): OpcionSeleccionada[] => {
    return hijos
      .filter((hijo) => hijo.item_padre_id === item.id)
      .map((hijo) => {
        if (!hijo.opcion_id) {
          return null;
        }
  
        const opcion = opcionesMap.get(hijo.opcion_id);
  
        const menuOpcion = hijo.menu_opcion_id
          ? menuOpcionesMap.get(hijo.menu_opcion_id)
          : undefined;
  
        const menuGrupo = menuOpcion
          ? menuGruposMap.get(menuOpcion.menu_grupo_id)
          : undefined;
  
        const grupo = menuGrupo
          ? gruposMap.get(menuGrupo.grupo_id)
          : undefined;
  
        return {
          menu_opcion_id: hijo.menu_opcion_id ?? "",
          opcion_id: hijo.opcion_id,
          nombre: opcion?.nombre ?? "Opción",
          grupo_id: grupo?.id ?? "",
          grupo_nombre: grupo?.nombre ?? "Grupo",
          recargo: Number(opcion?.recargo ?? 0),
        };
      })
      .filter(
        (opcion): opcion is OpcionSeleccionada =>
          opcion !== null,
      );
  };
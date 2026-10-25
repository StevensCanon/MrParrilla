"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export type TurnoCaja = {
id: string;
cajero_id: string;
abierto_en: string;
cerrado_en: string | null;
fondo_inicial: number;
efectivo_esperado: number | null;
efectivo_contado: number | null;
diferencia: number | null;
estado: "abierto" | "cerrado";
creado_en: string;
};

type UsuarioCaja = {
id: string;
nombre: string;
rol: "admin" | "cajero" | "mesero" | "cocina";
};

export type ResumenTurnoCaja = {
turno_id: string;
fondo_inicial: number;
ventas_efectivo: number;
ventas_transferencia: number;
ventas_tarjeta: number;
total_ventas: number;
total_egresos: number;
efectivo_esperado: number;
cantidad_egresos: number;
};

export type PagoRelacionCaja = {
  id: string;
  persona_numero: number | null;
  platos: string[];
  metodo_pago: "efectivo" | "transferencia" | "tarjeta";
  monto: number;
  monto_recibido: number | null;
  cambio: number | null;
  creado_en: string;
};

export type RelacionCaja = {
  comanda_id: string;
  mesa_id: string | null;
  mesa_nombre: string | null;
  pagos: PagoRelacionCaja[];
  total: number;
  fecha_ultimo_pago: string;
};

export type EgresoCaja = {
  id: string;
  concepto: string;
  categoria: string;
  monto: number;
  observacion: string | null;
  comprobante_path: string | null;
  creado_en: string;
};

const convertirNumero = (valor: unknown): number => {
const numero = Number(valor);

return Number.isFinite(numero) ? numero : 0;
};

export function useCajaPage() {
const router = useRouter();

const [turno, setTurno] = useState<TurnoCaja | null>(null);
const [usuario, setUsuario] = useState<UsuarioCaja | null>(null);
const [resumen, setResumen] =
useState<ResumenTurnoCaja | null>(null);

const [loading, setLoading] = useState(true);
const [cargandoResumen, setCargandoResumen] =
useState(false);

const [abriendo, setAbriendo] = useState(false);
const [cerrando, setCerrando] = useState(false);
const [registrandoEgreso, setRegistrandoEgreso] =
useState(false);

const [dialogoAbrir, setDialogoAbrir] = useState(false);
const [dialogoCerrar, setDialogoCerrar] = useState(false);
const [dialogoEgreso, setDialogoEgreso] =
useState(false);

const [error, setError] = useState<string | null>(null);
  const [relaciones, setRelaciones] = useState<RelacionCaja[]>([]);
  const [egresos, setEgresos] = useState<EgresoCaja[]>([]);
  const [cargandoRelaciones, setCargandoRelaciones] = useState(false);
  const [cargandoEgresos, setCargandoEgresos] = useState(false);
  const [errorRelaciones, setErrorRelaciones] = useState<string | null>(null);
  const [errorEgresos, setErrorEgresos] = useState<string | null>(null);
  const [abriendoComprobante, setAbriendoComprobante] = useState<string | null>(null);

  const cargarRelaciones = useCallback(async (turnoActual: TurnoCaja) => {
    setCargandoRelaciones(true);
    setErrorRelaciones(null);
    try {
      const columnasPago = "id,comanda_id,mesa_id,cuenta_persona_id,metodo_pago,monto,monto_recibido,cambio,creado_en";
      const [pagosDelTurno, pagosSinTurno] = await Promise.all([
        supabase
          .from("pagos")
          .select(columnasPago)
          .eq("turno_caja_id", turnoActual.id)
          .eq("estado", "confirmado")
          .order("creado_en", { ascending: false }),
        // Compatibilidad de lectura para pagos recientes que se crearon antes
        // de que el registro de pagos los asociara explícitamente al turno.
        supabase
          .from("pagos")
          .select(columnasPago)
          .is("turno_caja_id", null)
          .eq("cajero_id", turnoActual.cajero_id)
          .eq("estado", "confirmado")
          .gte("creado_en", turnoActual.abierto_en)
          .order("creado_en", { ascending: false }),
      ]);
      if (pagosDelTurno.error) throw new Error(pagosDelTurno.error.message);
      if (pagosSinTurno.error) throw new Error(pagosSinTurno.error.message);

      // Consultamos las mesas por separado para evitar depender de joins ambiguos.
      const filas = [...new Map([
        ...(pagosDelTurno.data ?? []),
        ...(pagosSinTurno.data ?? []),
      ].map((pago) => [String(pago.id), pago] as const)).values()]
        .sort((a, b) => new Date(String(b.creado_en)).getTime() - new Date(String(a.creado_en)).getTime());
      const idsPersonas = [...new Set(filas
        .map((pago) => pago.cuenta_persona_id)
        .filter((id): id is string => typeof id === "string"))];
      const personasPorId = new Map<string, number>();
      const asignacionesPorPersona = new Map<string, { itemId: string; cantidad: number }[]>();
      const nombresPlatos = new Map<string, string>();
      const platosPorPersona = new Map<string, string[]>();

      if (idsPersonas.length > 0) {
        const { data: personas, error: personasError } = await supabase
          .from("comanda_personas")
          .select("id,numero")
          .in("id", idsPersonas);
        if (personasError) throw new Error(personasError.message);
        for (const persona of personas ?? []) {
          personasPorId.set(String(persona.id), Number(persona.numero));
        }

        const { data: asignaciones, error: asignacionesError } = await supabase
          .from("comanda_persona_items")
          .select("persona_id,comanda_item_id,cantidad")
          .in("persona_id", idsPersonas);
        if (asignacionesError) throw new Error(asignacionesError.message);
        const idsItems = [...new Set((asignaciones ?? []).map((item) => String(item.comanda_item_id)))];
        for (const asignacion of asignaciones ?? []) {
          const personaId = String(asignacion.persona_id);
          const actuales = asignacionesPorPersona.get(personaId) ?? [];
          actuales.push({ itemId: String(asignacion.comanda_item_id), cantidad: convertirNumero(asignacion.cantidad) });
          asignacionesPorPersona.set(personaId, actuales);
        }

        if (idsItems.length > 0) {
          const { data: items, error: itemsError } = await supabase
            .from("comanda_items")
            .select("id,plato_id")
            .in("id", idsItems);
          if (itemsError) throw new Error(itemsError.message);
          const idsPlatos = [...new Set((items ?? []).map((item) => String(item.plato_id)))];
          if (idsPlatos.length > 0) {
            const { data: platos, error: platosError } = await supabase
              .from("platos")
              .select("id,nombre")
              .in("id", idsPlatos);
            if (platosError) throw new Error(platosError.message);
            for (const plato of platos ?? []) {
              nombresPlatos.set(String(plato.id), String(plato.nombre));
            }
          }
          const platoPorItem = new Map((items ?? []).map((item) => [String(item.id), String(item.plato_id)]));
          for (const [personaId, asignacionesPersona] of asignacionesPorPersona) {
            platosPorPersona.set(personaId, asignacionesPersona.map((asignacion) => {
              const platoId = platoPorItem.get(asignacion.itemId);
              const nombre = platoId ? nombresPlatos.get(platoId) ?? "Plato" : "Plato";
              return `${asignacion.cantidad} × ${nombre}`;
            }));
          }
        }
      }

      const idsMesas = [...new Set(filas.map((pago) => pago.mesa_id).filter((id): id is string => typeof id === "string"))];
      const nombresMesas = new Map<string, string>();
      if (idsMesas.length) {
        const { data: mesas, error: mesasError } = await supabase
          .from("mesas")
          .select("*")
          .in("id", idsMesas);
        if (mesasError) throw new Error(mesasError.message);
        for (const mesa of mesas ?? []) {
          const fila = mesa as Record<string, unknown>;
          const etiqueta = fila.numero ?? fila.numero_mesa ?? fila.nombre ?? fila.codigo;
          nombresMesas.set(String(fila.id), etiqueta == null ? String(fila.id).slice(0, 8) : String(etiqueta));
        }
      }
      const relacionesPorComanda = new Map<string, RelacionCaja>();
      for (const pago of filas) {
        const comandaId = String(pago.comanda_id);
        const creadoEn = String(pago.creado_en);
        const relacion = relacionesPorComanda.get(comandaId) ?? {
          comanda_id: comandaId,
          mesa_id: pago.mesa_id ? String(pago.mesa_id) : null,
          mesa_nombre: pago.mesa_id ? nombresMesas.get(String(pago.mesa_id)) ?? null : null,
          pagos: [],
          total: 0,
          fecha_ultimo_pago: creadoEn,
        };
        const detallePago: PagoRelacionCaja = {
          id: String(pago.id),
          persona_numero: pago.cuenta_persona_id ? personasPorId.get(String(pago.cuenta_persona_id)) ?? null : null,
          platos: pago.cuenta_persona_id ? platosPorPersona.get(String(pago.cuenta_persona_id)) ?? [] : [],
          metodo_pago: pago.metodo_pago as PagoRelacionCaja["metodo_pago"],
          monto: convertirNumero(pago.monto),
          monto_recibido: pago.monto_recibido == null ? null : convertirNumero(pago.monto_recibido),
          cambio: pago.cambio == null ? null : convertirNumero(pago.cambio),
          creado_en: creadoEn,
        };
        relacion.pagos.push(detallePago);
        relacion.total += detallePago.monto;
        if (new Date(creadoEn).getTime() > new Date(relacion.fecha_ultimo_pago).getTime()) {
          relacion.fecha_ultimo_pago = creadoEn;
        }
        relacionesPorComanda.set(comandaId, relacion);
      }

      const relacionesAgrupadas = [...relacionesPorComanda.values()];
      for (const relacion of relacionesAgrupadas) {
        relacion.pagos.sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());
      }
      relacionesAgrupadas.sort(
        (a, b) => new Date(b.fecha_ultimo_pago).getTime() - new Date(a.fecha_ultimo_pago).getTime(),
      );
      setRelaciones(relacionesAgrupadas);
    } catch (err) {
      setRelaciones([]);
      setErrorRelaciones(err instanceof Error ? err.message : "No se pudieron cargar las relaciones.");
    } finally {
      setCargandoRelaciones(false);
    }
  }, []);

  const cargarEgresos = useCallback(async (turnoId: string) => {
    setCargandoEgresos(true);
    setErrorEgresos(null);
    try {
      const { data, error: consultaError } = await supabase
        .from("movimientos_caja")
        .select("id,concepto,categoria,monto,observacion,comprobante_path,creado_en")
        .eq("turno_caja_id", turnoId)
        .eq("tipo", "egreso")
        .order("creado_en", { ascending: false });
      if (consultaError) throw new Error(consultaError.message);
      setEgresos((data ?? []).map((fila) => ({
        id: String(fila.id),
        concepto: String(fila.concepto),
        categoria: String(fila.categoria),
        monto: convertirNumero(fila.monto),
        observacion: fila.observacion ?? null,
        comprobante_path: fila.comprobante_path ?? null,
        creado_en: String(fila.creado_en),
      })));
    } catch (err) {
      setEgresos([]);
      setErrorEgresos(err instanceof Error ? err.message : "No se pudieron cargar los egresos.");
    } finally {
      setCargandoEgresos(false);
    }
  }, []);

  const verComprobante = async (egreso: EgresoCaja) => {
    if (!egreso.comprobante_path || abriendoComprobante) return;
    setAbriendoComprobante(egreso.id);
    setErrorEgresos(null);
    try {
      const { data, error: enlaceError } = await supabase.storage
        .from("caja-comprobantes")
        .createSignedUrl(egreso.comprobante_path, 60);
      if (enlaceError || !data?.signedUrl) {
        throw new Error(enlaceError?.message ?? "No se pudo abrir el comprobante.");
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setErrorEgresos(err instanceof Error ? err.message : "No se pudo abrir el comprobante.");
    } finally {
      setAbriendoComprobante(null);
    }
  };


const cargarResumen = useCallback(async () => {
setCargandoResumen(true);


try {
  const {
    data,
    error: resumenError,
  } = await supabase.rpc("obtener_resumen_turno_caja");

  if (resumenError) {
    throw new Error(
      resumenError.message ||
        "No se pudo obtener el resumen de caja.",
    );
  }

  const fila =
    Array.isArray(data) && data.length > 0
      ? data[0]
      : null;

  if (!fila) {
    setResumen(null);
    return;
  }

  const resumenActual: ResumenTurnoCaja = {
    turno_id: String(fila.turno_id),
    fondo_inicial: convertirNumero(fila.fondo_inicial),
    ventas_efectivo: convertirNumero(
      fila.ventas_efectivo,
    ),
    ventas_transferencia: convertirNumero(
      fila.ventas_transferencia,
    ),
    ventas_tarjeta: convertirNumero(
      fila.ventas_tarjeta,
    ),
    total_ventas: convertirNumero(fila.total_ventas),
    total_egresos: convertirNumero(
      fila.total_egresos,
    ),
    efectivo_esperado: convertirNumero(
      fila.efectivo_esperado,
    ),
    cantidad_egresos:
      Number(fila.cantidad_egresos) || 0,
  };

  setResumen(resumenActual);
} finally {
  setCargandoResumen(false);
}


}, []);

const cargarTurno = useCallback(async () => {
setError(null);


try {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  const {
    data: usuarioData,
    error: usuarioError,
  } = await supabase
    .from("usuarios")
    .select("id,nombre,rol")
    .eq("id", user.id)
    .single();

  if (usuarioError) {
    throw new Error(
      usuarioError.message ||
        "No se pudo obtener la información del usuario.",
    );
  }

  if (!usuarioData) {
    throw new Error(
      "No se encontró el usuario autenticado.",
    );
  }

  const usuarioActual =
    usuarioData as UsuarioCaja;

  setUsuario(usuarioActual);

  if (
    usuarioActual.rol !== "admin" &&
    usuarioActual.rol !== "cajero"
  ) {
    setTurno(null);
    setResumen(null);
    setRelaciones([]);
    setEgresos([]);
    return;
  }

  const {
    data: turnoData,
    error: turnoError,
  } = await supabase.rpc(
    "obtener_turno_caja_actual",
  );

  if (turnoError) {
    throw new Error(
      turnoError.message ||
        "No se pudo consultar el turno de caja.",
    );
  }

  const turnoActual =
    Array.isArray(turnoData) &&
    turnoData.length > 0
      ? (turnoData[0] as TurnoCaja)
      : null;

  setTurno(turnoActual);

  if (!turnoActual) {
    setResumen(null);
    setRelaciones([]);
    setEgresos([]);
    return;
  }

  await Promise.all([
    cargarResumen(),
    cargarRelaciones(turnoActual),
    cargarEgresos(turnoActual.id),
  ]);
} catch (err) {
  setTurno(null);
  setResumen(null);
  setRelaciones([]);
  setEgresos([]);

  setError(
    err instanceof Error
      ? err.message
      : "No se pudo cargar la caja.",
  );
}


}, [cargarResumen, cargarRelaciones, cargarEgresos, router]);

useEffect(() => {
let cancelado = false;


const cargar = async () => {
  try {
    await cargarTurno();
  } finally {
    if (!cancelado) {
      setLoading(false);
    }
  }
};

void cargar();

return () => {
  cancelado = true;
};


}, [cargarTurno]);

const actualizar = async () => {
if (
loading ||
cargandoResumen ||
abriendo ||
cerrando ||
registrandoEgreso
) {
return;
}


await cargarTurno();


};

const abrirDialogo = () => {
setError(null);
setDialogoAbrir(true);
};

const cerrarDialogo = () => {
if (abriendo) {
return;
}


setDialogoAbrir(false);


};

const abrirCaja = async (fondoInicial: number) => {
if (abriendo) {
return;
}


setAbriendo(true);
setError(null);

try {
  if (
    !Number.isFinite(fondoInicial) ||
    fondoInicial < 0
  ) {
    throw new Error(
      "El fondo inicial debe ser un valor válido mayor o igual a cero.",
    );
  }

  const {
    data: resultado,
    error: errorRPC,
  } = await supabase.rpc("abrir_turno_caja", {
    p_fondo_inicial: fondoInicial,
  });

  if (errorRPC) {
    throw new Error(
      errorRPC.message ||
        "No se pudo abrir el turno de caja.",
    );
  }

  void resultado;

  setDialogoAbrir(false);

  await cargarTurno();
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "No se pudo abrir el turno de caja.",
  );
} finally {
  setAbriendo(false);
}


};

const abrirDialogoCerrar = () => {
if (!turno) {
return;
}


setError(null);
setDialogoCerrar(true);


};

const cerrarDialogoCerrar = () => {
if (cerrando) {
return;
}


setDialogoCerrar(false);


};

const cerrarCaja = async (
efectivoContado: number,
) => {
if (!turno || cerrando) {
return;
}


setCerrando(true);
setError(null);

try {
  if (
    !Number.isFinite(efectivoContado) ||
    efectivoContado < 0
  ) {
    throw new Error(
      "El efectivo contado debe ser un valor válido mayor o igual a cero.",
    );
  }

  const {
    data: resultado,
    error: errorRPC,
  } = await supabase.rpc("cerrar_turno_caja", {
    p_turno_caja_id: turno.id,
    p_efectivo_contado: efectivoContado,
  });

  if (errorRPC) {
    throw new Error(
      errorRPC.message ||
        "No se pudo cerrar el turno de caja.",
    );
  }

  void resultado;

  setDialogoCerrar(false);

  await cargarTurno();
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "No se pudo cerrar el turno de caja.",
  );
} finally {
  setCerrando(false);
}


};

const abrirDialogoEgreso = () => {
if (!turno || registrandoEgreso) {
return;
}


setError(null);
setDialogoEgreso(true);


};

const cerrarDialogoEgreso = () => {
if (registrandoEgreso) {
return;
}


setDialogoEgreso(false);


};

const registrarEgreso = async (
concepto: string,
categoria: string,
monto: number,
observacion: string,
archivo: File | null,
) => {
if (!turno || registrandoEgreso) {
return;
}


setRegistrandoEgreso(true);
setError(null);

let comprobantePath: string | null = null;

try {
  if (!concepto.trim()) {
    throw new Error(
      "El concepto del egreso es obligatorio.",
    );
  }

  if (!categoria.trim()) {
    throw new Error(
      "La categoría del egreso es obligatoria.",
    );
  }

  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error(
      "El monto del egreso debe ser mayor a cero.",
    );
  }

  const efectivoDisponible =
    resumen?.efectivo_esperado ?? 0;

  if (monto > efectivoDisponible) {
    throw new Error(
      `El monto supera el efectivo disponible de ${new Intl.NumberFormat(
        "es-CO",
        {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        },
      ).format(Math.round(efectivoDisponible))}.`,
    );
  }

  /*
   * Si existe comprobante, se sube primero.
   *
   * La ruta queda asociada al turno actual.
   */
  if (archivo) {
    const extension =
      archivo.name.split(".").pop()?.toLowerCase() ||
      "archivo";

    const nombreArchivo = `${crypto.randomUUID()}.${extension}`;

    comprobantePath =
      `${turno.id}/${nombreArchivo}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("caja-comprobantes")
      .upload(comprobantePath, archivo, {
        cacheControl: "3600",
        upsert: false,
        contentType: archivo.type,
      });

    if (uploadError) {
      throw new Error(
        uploadError.message ||
          "No se pudo subir el comprobante.",
      );
    }
  }

  /*
   * Registrar egreso mediante RPC SECURITY DEFINER.
   */
  const {
    data: resultado,
    error: errorRPC,
  } = await supabase.rpc(
    "registrar_egreso_caja",
    {
      p_turno_caja_id: turno.id,
      p_concepto: concepto.trim(),
      p_categoria: categoria.trim(),
      p_monto: monto,
      p_observacion:
        observacion.trim() || null,
      p_comprobante_path: comprobantePath,
    },
  );

  if (errorRPC) {
    /*
     * Si la RPC falla después de subir el archivo,
     * eliminamos el comprobante para no dejar archivos
     * huérfanos en Storage.
     */
    if (comprobantePath) {
      await supabase.storage
        .from("caja-comprobantes")
        .remove([comprobantePath]);
    }

    throw new Error(
      errorRPC.message ||
        "No se pudo registrar el egreso.",
    );
  }

  void resultado;

  setDialogoEgreso(false);

  await Promise.all([cargarResumen(), cargarEgresos(turno.id)]);
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "No se pudo registrar el egreso.",
  );
} finally {
  setRegistrandoEgreso(false);
}


};

return {
turno,
usuario,
resumen,
relaciones,
egresos,
cargandoRelaciones,
cargandoEgresos,
errorRelaciones,
errorEgresos,
abriendoComprobante,
verComprobante,


loading,
cargandoResumen,
abriendo,
cerrando,
registrandoEgreso,

dialogoAbrir,
dialogoCerrar,
dialogoEgreso,

error,

setError,

abrirDialogo,
cerrarDialogo,
abrirCaja,

abrirDialogoCerrar,
cerrarDialogoCerrar,
cerrarCaja,

abrirDialogoEgreso,
cerrarDialogoEgreso,
registrarEgreso,

cargarTurno,
actualizar,


};
}

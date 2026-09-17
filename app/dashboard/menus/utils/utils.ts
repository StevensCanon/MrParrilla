import { ORDEN_PLATOS } from '../constants/constants';

type PlatoOrdenable = {
  platos: {
    nombre: string;
  } | null;
};

export function formatearFecha(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatearFechaCorta(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatearRecargo(recargo: number): string | null {
  const valor = Number(recargo) || 0;

  if (valor <= 0) {
    return null;
  }

  return `+$${valor.toLocaleString('es-CO')}`;
}

export function ordenarPorTipoDePlato<T extends PlatoOrdenable>(
  platos: T[]
): T[] {
  return [...platos].sort((a, b) => {
    const nombreA = a.platos?.nombre ?? '';
    const nombreB = b.platos?.nombre ?? '';

    const posicionA = ORDEN_PLATOS.indexOf(
      nombreA as (typeof ORDEN_PLATOS)[number]
    );

    const posicionB = ORDEN_PLATOS.indexOf(
      nombreB as (typeof ORDEN_PLATOS)[number]
    );

    const ordenA =
      posicionA === -1 ? Number.MAX_SAFE_INTEGER : posicionA;

    const ordenB =
      posicionB === -1 ? Number.MAX_SAFE_INTEGER : posicionB;

    return ordenA - ordenB;
  });
}

/**
 * Obtiene la fecha actual usando la zona horaria de Colombia.
 *
 * Evita que cerca de la medianoche el navegador utilice
 * una fecha UTC diferente a la fecha local de Colombia.
 */
export function obtenerFechaColombia(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes.map((parte) => [parte.type, parte.value])
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}
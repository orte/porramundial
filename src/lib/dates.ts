/**
 * Utilidades de fecha. En DB todo va en UTC (timestamptz); en la UI se muestra
 * en horario de Madrid con Intl.DateTimeFormat.
 */

const TZ = 'Europe/Madrid';

export function formatMadrid(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('es-ES', { timeZone: TZ, ...opts }).format(date);
}

/** Clave estable YYYY-MM-DD en horario Madrid, para agrupar por día. */
export function madridDayKey(date: Date): string {
  // en-CA da el formato ISO YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** "jueves, 11 de junio" */
export function formatDayHeading(date: Date): string {
  return formatMadrid(date, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "17:00" */
export function formatTime(date: Date): string {
  return formatMadrid(date, { hour: '2-digit', minute: '2-digit' });
}

/** "11 jun · 17:00" */
export function formatShort(date: Date): string {
  return formatMadrid(date, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Utilidades de fecha. En DB todo va en UTC (timestamptz); en la UI se muestra
 * en horario de Madrid con Intl.DateTimeFormat.
 *
 * El parámetro `locale` por defecto es 'es-ES' (el panel admin lo usa así). Las
 * páginas públicas, traducidas al euskera, pasan 'eu'.
 */

const TZ = 'Europe/Madrid';

export function formatMadrid(
  date: Date,
  opts: Intl.DateTimeFormatOptions,
  locale = 'es-ES',
): string {
  return new Intl.DateTimeFormat(locale, { timeZone: TZ, ...opts }).format(date);
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

/** "jueves, 11 de junio" (es) · "osteguna, ekainak 11" (eu) */
export function formatDayHeading(date: Date, locale = 'es-ES'): string {
  return formatMadrid(date, { weekday: 'long', day: 'numeric', month: 'long' }, locale);
}

/** "17:00" */
export function formatTime(date: Date, locale = 'es-ES'): string {
  return formatMadrid(date, { hour: '2-digit', minute: '2-digit' }, locale);
}

/** "11 jun · 17:00" */
export function formatShort(date: Date, locale = 'es-ES'): string {
  return formatMadrid(
    date,
    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
    locale,
  );
}

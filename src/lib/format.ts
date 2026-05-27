/** Formatea puntos a medios, con coma decimal española: 7 → "7", 7.5 → "7,5". */
export function formatPoints(n: number): string {
  const rounded = Math.round(n * 2) / 2;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace('.', ',');
}

/** "+3", "0", "+0,5" — para desgloses y deltas. */
export function formatSigned(n: number): string {
  const s = formatPoints(Math.abs(n));
  if (n > 0) return `+${s}`;
  if (n < 0) return `−${s}`;
  return '0';
}

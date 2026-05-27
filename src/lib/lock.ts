import { db } from '@/db';
import { config } from '@/db/schema';
import { eq } from 'drizzle-orm';

const FALLBACK_LOCK_DATE = '2026-06-11T17:00:00.000Z';

/**
 * Devuelve la fecha de bloqueo de porras (desde la tabla config o el fallback).
 * A partir de esa fecha no se pueden crear ni editar porras.
 */
export async function getLockDate(): Promise<Date> {
  try {
    const [row] = await db
      .select()
      .from(config)
      .where(eq(config.key, 'lock_date'))
      .limit(1);
    if (row) return new Date(row.value);
  } catch (err) {
    console.error('Error leyendo lock_date:', err);
  }
  return new Date(process.env.LOCK_DATE ?? FALLBACK_LOCK_DATE);
}

export async function isLocked(): Promise<boolean> {
  const lockDate = await getLockDate();
  return new Date() >= lockDate;
}

/** Versión sync con env, útil en componentes cliente (vía prop). */
export function isLockedClient(lockDateISO: string): boolean {
  return new Date() >= new Date(lockDateISO);
}

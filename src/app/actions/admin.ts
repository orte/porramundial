'use server';

import { db } from '@/db';
import { config, matches, players, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  verifyAdminPassword,
} from '@/lib/admin-auth';
import { deriveWinner, recalcAllPoints, validateMatchResult } from '@/lib/scoring';

export type AdminActionResult = { ok: true } | { ok: false; error: string };

// Revalida las rutas afectadas por un cambio de puntos. Las páginas públicas
// son force-dynamic, pero revalidamos por si acaso.
function revalidateScoring(adminPath: string): void {
  revalidatePath(adminPath);
  revalidatePath('/admin');
  revalidatePath('/clasificacion');
}

// ─── AUTENTICACIÓN ────────────────────────────────────────────────────────

export async function login(password: string): Promise<AdminActionResult> {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, error: 'Introduce la contraseña.' };
  }
  if (!(await verifyAdminPassword(password))) {
    return { ok: false, error: 'Contraseña incorrecta.' };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect('/admin/login');
}

// ─── RESULTADOS DE PARTIDOS ────────────────────────────────────────────────

export type MatchResultPayload = {
  matchId: number;
  homeGoals: number;
  awayGoals: number;
  homeGoalsAfterExtra: number | null;
  awayGoalsAfterExtra: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
};

export async function saveMatchResult(payload: MatchResultPayload): Promise<AdminActionResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, payload.matchId)).limit(1);
  if (!match) return { ok: false, error: 'El partido no existe.' };
  if (match.homeTeamId == null || match.awayTeamId == null) {
    return { ok: false, error: 'Asigna los dos equipos antes de meter el resultado.' };
  }

  const result = {
    homeGoals: payload.homeGoals,
    awayGoals: payload.awayGoals,
    homeGoalsAfterExtra: payload.homeGoalsAfterExtra,
    awayGoalsAfterExtra: payload.awayGoalsAfterExtra,
    homePenalties: payload.homePenalties,
    awayPenalties: payload.awayPenalties,
  };

  const validation = validateMatchResult(match.stage, result);
  if (validation) return { ok: false, error: validation };

  const { winnerTeamId, winMode } = deriveWinner({
    stage: match.stage,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    ...result,
  });

  // Guardamos prórroga/penaltis solo cuando el modo lo justifica, para no dejar
  // datos colgando si el admin corrige un resultado de prórroga a uno de 90'.
  const storeExtra = winMode === 'extra_time' || winMode === 'penalties';
  const storePens = winMode === 'penalties';

  await db
    .update(matches)
    .set({
      played: true,
      homeGoals: payload.homeGoals,
      awayGoals: payload.awayGoals,
      homeGoalsAfterExtra: storeExtra ? payload.homeGoalsAfterExtra : null,
      awayGoalsAfterExtra: storeExtra ? payload.awayGoalsAfterExtra : null,
      homePenalties: storePens ? payload.homePenalties : null,
      awayPenalties: storePens ? payload.awayPenalties : null,
      winMode,
      winnerTeamId,
    })
    .where(eq(matches.id, payload.matchId));

  await recalcAllPoints();
  revalidateScoring('/admin/partidos');
  return { ok: true };
}

export async function deleteMatchResult(matchId: number): Promise<AdminActionResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) return { ok: false, error: 'El partido no existe.' };

  await db
    .update(matches)
    .set({
      played: false,
      homeGoals: null,
      awayGoals: null,
      homeGoalsAfterExtra: null,
      awayGoalsAfterExtra: null,
      homePenalties: null,
      awayPenalties: null,
      winMode: null,
      winnerTeamId: null,
    })
    .where(eq(matches.id, matchId));

  await recalcAllPoints();
  revalidateScoring('/admin/partidos');
  return { ok: true };
}

// ─── POSICIONES DE GRUPO ───────────────────────────────────────────────────

export type GroupPositionsPayload = {
  groupCode: string;
  positions: { teamId: number; position: number | null }[];
};

export async function saveGroupPositions(
  payload: GroupPositionsPayload,
): Promise<AdminActionResult> {
  const teamsInGroup = await db.select().from(teams).where(eq(teams.groupCode, payload.groupCode));
  if (teamsInGroup.length === 0) return { ok: false, error: 'Grupo no encontrado.' };

  const validIds = new Set(teamsInGroup.map((t) => t.id));
  for (const p of payload.positions) {
    if (!validIds.has(p.teamId)) {
      return { ok: false, error: 'Algún equipo no pertenece a este grupo.' };
    }
    if (p.position !== null && ![1, 2, 3, 4].includes(p.position)) {
      return { ok: false, error: 'Posición inválida.' };
    }
  }

  const assigned = payload.positions
    .map((p) => p.position)
    .filter((x): x is number => x !== null);
  if (new Set(assigned).size !== assigned.length) {
    return { ok: false, error: 'No puede haber dos equipos en la misma posición.' };
  }

  const posByTeam = new Map(payload.positions.map((p) => [p.teamId, p.position]));
  await Promise.all(
    teamsInGroup.map((t) => {
      const pos = posByTeam.has(t.id) ? (posByTeam.get(t.id) ?? null) : t.groupPosition;
      // 3º y 4º quedan eliminados (no dan puntos, pero marcamos el estado).
      const eliminated = pos === 3 || pos === 4;
      return db
        .update(teams)
        .set({ groupPosition: pos, eliminated })
        .where(eq(teams.id, t.id));
    }),
  );

  await recalcAllPoints();
  revalidateScoring('/admin/grupos');
  return { ok: true };
}

// ─── CRUCES DE ELIMINATORIAS ───────────────────────────────────────────────

export type KnockoutTeamsPayload = {
  matchId: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
};

export async function saveKnockoutTeams(
  payload: KnockoutTeamsPayload,
): Promise<AdminActionResult> {
  const [match] = await db.select().from(matches).where(eq(matches.id, payload.matchId)).limit(1);
  if (!match) return { ok: false, error: 'El partido no existe.' };
  if (match.stage === 'group') {
    return { ok: false, error: 'No se pueden reasignar equipos en la fase de grupos.' };
  }
  if (
    payload.homeTeamId != null &&
    payload.awayTeamId != null &&
    payload.homeTeamId === payload.awayTeamId
  ) {
    return { ok: false, error: 'Un equipo no puede jugar contra sí mismo.' };
  }

  for (const id of [payload.homeTeamId, payload.awayTeamId]) {
    if (id != null) {
      const [t] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, id)).limit(1);
      if (!t) return { ok: false, error: 'Equipo no encontrado.' };
    }
  }

  await db
    .update(matches)
    .set({ homeTeamId: payload.homeTeamId, awayTeamId: payload.awayTeamId })
    .where(eq(matches.id, payload.matchId));

  // Si se reasignan equipos de un partido ya jugado, el resultado podría
  // afectar a los puntos: recalculamos por seguridad.
  await recalcAllPoints();
  revalidatePath('/admin/eliminatorias');
  revalidatePath('/admin/partidos');
  revalidatePath('/admin');
  revalidatePath('/clasificacion');
  return { ok: true };
}

// ─── GOLEADORES / BOTA DE ORO ──────────────────────────────────────────────

export async function saveScorerGoals(playerId: number, goals: number): Promise<AdminActionResult> {
  if (!Number.isInteger(goals) || goals < 0) {
    return { ok: false, error: 'Los goles deben ser un entero mayor o igual a 0.' };
  }
  const [p] = await db.select({ id: players.id }).from(players).where(eq(players.id, playerId)).limit(1);
  if (!p) return { ok: false, error: 'Jugador no encontrado.' };

  await db.update(players).set({ goals }).where(eq(players.id, playerId));
  await recalcAllPoints();
  revalidateScoring('/admin/goleadores');
  return { ok: true };
}

export async function setGoldenBoot(playerId: number | null): Promise<AdminActionResult> {
  if (playerId !== null) {
    const [p] = await db.select({ id: players.id }).from(players).where(eq(players.id, playerId)).limit(1);
    if (!p) return { ok: false, error: 'Jugador no encontrado.' };
  }

  // Selector único: desmarcamos todos y marcamos al elegido (si lo hay).
  await db.update(players).set({ isGoldenBoot: false }).where(eq(players.isGoldenBoot, true));
  if (playerId !== null) {
    await db.update(players).set({ isGoldenBoot: true }).where(eq(players.id, playerId));
  }

  await recalcAllPoints();
  revalidateScoring('/admin/goleadores');
  return { ok: true };
}

// ─── CONFIGURACIÓN ──────────────────────────────────────────────────────────

export async function saveLockDate(isoDate: string): Promise<AdminActionResult> {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return { ok: false, error: 'Fecha inválida.' };

  await db
    .insert(config)
    .values({ key: 'lock_date', value: d.toISOString() })
    .onConflictDoUpdate({ target: config.key, set: { value: d.toISOString() } });

  revalidatePath('/admin/config');
  revalidatePath('/admin');
  revalidatePath('/');
  return { ok: true };
}

// ─── RECÁLCULO MANUAL ────────────────────────────────────────────────────────

export async function recalcPointsManually(): Promise<AdminActionResult> {
  await recalcAllPoints();
  revalidatePath('/admin');
  revalidatePath('/clasificacion');
  return { ok: true };
}

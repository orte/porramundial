/**
 * Motor de puntuación de las porras.
 *
 * Recalcula SIEMPRE desde cero a partir del estado actual de la DB (partidos
 * jugados, posiciones de grupo, goles del goleador). Es más simple y robusto
 * que ir incrementando: cuando el admin corrige un resultado, basta con volver
 * a llamar a recalcAllPoints().
 *
 * Tabla de puntos (CLAUDE.md + casos de final/3er puesto acordados con el
 * cliente):
 *
 *  - Victoria en los 90' (regulation), cualquier partido ............ +2
 *  - Empate (solo fase de grupos) ................................... +1
 *  - 1º de grupo .................................................... +1
 *  - 2º de grupo .................................................... +0,5
 *  - Avanzar en eliminatoria (ganar cruce r32→semis, cualquier modo)  +2
 *  - Ganar el 3er puesto ............................................ +1
 *  - Ganar el Mundial ............................................... +4
 *  - Por cada gol del candidato a Bota de Oro ....................... +3
 *  - Si el candidato es la Bota de Oro .............................. +4
 *
 * Ejemplos clave (acumulación):
 *  - Cuartos ganados en 90' = +2 (victoria) + 2 (avanzar) = 4. En penaltis = 2.
 *  - Final ganada en 90' = +2 (victoria) + 4 (Mundial) = 6. En penaltis = 4.
 *  - 3er puesto ganado en 90' = +2 (victoria) + 1 = 3. En penaltis = 1.
 */

import { db } from '@/db';
import { entries, entryTeams, matches, players, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Match } from '@/db/schema';

type Stage = Match['stage'];
type WinMode = NonNullable<Match['winMode']>;

// ─── PUNTOS ─────────────────────────────────────────────────────────────
const WIN_REGULATION_POINTS = 2;
const DRAW_POINTS = 1;
const ADVANCE_POINTS = 2;
const THIRD_PLACE_POINTS = 1;
const WORLD_CUP_POINTS = 4;
const GROUP_FIRST_POINTS = 1;
const GROUP_SECOND_POINTS = 0.5;
const GOLDEN_BOOT_GOAL_POINTS = 3;
const GOLDEN_BOOT_WINNER_POINTS = 4;

// Cruces en los que ganar significa "avanzar" a la siguiente ronda.
const ADVANCE_STAGES: ReadonlySet<Stage> = new Set<Stage>([
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
]);

export function isKnockout(stage: Stage): boolean {
  return stage !== 'group';
}

// ─── deriveWinner ─────────────────────────────────────────────────────────

export type DeriveWinnerInput = {
  stage: Stage;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeGoals: number | null;
  awayGoals: number | null;
  homeGoalsAfterExtra: number | null;
  awayGoalsAfterExtra: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
};

export type DerivedResult = {
  winnerTeamId: number | null;
  winMode: WinMode;
};

/**
 * Dado un partido y sus goles, determina el ganador y el modo de victoria.
 * Asume que los datos ya pasaron validateMatchResult(); si no, devuelve el
 * mejor resultado posible (sin romper).
 */
export function deriveWinner(m: DeriveWinnerInput): DerivedResult {
  const hg = m.homeGoals ?? 0;
  const ag = m.awayGoals ?? 0;

  // Fase de grupos: el empate es un resultado válido.
  if (m.stage === 'group') {
    if (hg > ag) return { winnerTeamId: m.homeTeamId, winMode: 'regulation' };
    if (ag > hg) return { winnerTeamId: m.awayTeamId, winMode: 'regulation' };
    return { winnerTeamId: null, winMode: 'draw' };
  }

  // Eliminatorias: decidido en los 90'.
  if (hg > ag) return { winnerTeamId: m.homeTeamId, winMode: 'regulation' };
  if (ag > hg) return { winnerTeamId: m.awayTeamId, winMode: 'regulation' };

  // 90' en empate → prórroga.
  const he = m.homeGoalsAfterExtra;
  const ae = m.awayGoalsAfterExtra;
  if (he != null && ae != null && he !== ae) {
    return {
      winnerTeamId: he > ae ? m.homeTeamId : m.awayTeamId,
      winMode: 'extra_time',
    };
  }

  // Sigue empate tras prórroga → penaltis.
  const hp = m.homePenalties;
  const ap = m.awayPenalties;
  if (hp != null && ap != null && hp !== ap) {
    return {
      winnerTeamId: hp > ap ? m.homeTeamId : m.awayTeamId,
      winMode: 'penalties',
    };
  }

  // No hay forma de romper el empate (datos incompletos): no debería pasar.
  return { winnerTeamId: null, winMode: 'penalties' };
}

// ─── validateMatchResult ──────────────────────────────────────────────────

export type MatchResultInput = {
  homeGoals: number;
  awayGoals: number;
  homeGoalsAfterExtra: number | null;
  awayGoalsAfterExtra: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
};

function isNonNegInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0;
}

/**
 * Valida un resultado. Devuelve un mensaje de error (string) o null si es
 * válido. Las eliminatorias no pueden acabar en empate: hay que escalar a
 * prórroga y, si sigue empate, a penaltis.
 */
export function validateMatchResult(stage: Stage, r: MatchResultInput): string | null {
  if (!isNonNegInt(r.homeGoals) || !isNonNegInt(r.awayGoals)) {
    return 'Los goles deben ser números enteros mayores o iguales a 0.';
  }

  // Grupos: cualquier resultado vale, incluido el empate.
  if (stage === 'group') return null;

  // Eliminatorias decididas en los 90'.
  if (r.homeGoals !== r.awayGoals) return null;

  // 90' en empate → hace falta prórroga.
  if (r.homeGoalsAfterExtra == null || r.awayGoalsAfterExtra == null) {
    return 'El partido acabó empatado en los 90 minutos: indica el resultado tras la prórroga.';
  }
  if (!isNonNegInt(r.homeGoalsAfterExtra) || !isNonNegInt(r.awayGoalsAfterExtra)) {
    return 'Los goles tras la prórroga deben ser enteros mayores o iguales a 0.';
  }
  if (r.homeGoalsAfterExtra < r.homeGoals || r.awayGoalsAfterExtra < r.awayGoals) {
    return 'El resultado tras la prórroga no puede ser inferior al de los 90 minutos.';
  }
  if (r.homeGoalsAfterExtra !== r.awayGoalsAfterExtra) return null;

  // Sigue empate tras prórroga → hacen falta penaltis.
  if (r.homePenalties == null || r.awayPenalties == null) {
    return 'Sigue el empate tras la prórroga: indica la tanda de penaltis.';
  }
  if (!isNonNegInt(r.homePenalties) || !isNonNegInt(r.awayPenalties)) {
    return 'Los penaltis deben ser enteros mayores o iguales a 0.';
  }
  if (r.homePenalties === r.awayPenalties) {
    return 'Los penaltis no pueden quedar empatados: tiene que haber un ganador.';
  }
  return null;
}

// ─── recalcAllPoints ────────────────────────────────────────────────────

export function groupPositionPoints(pos: number | null): number {
  if (pos === 1) return GROUP_FIRST_POINTS;
  if (pos === 2) return GROUP_SECOND_POINTS;
  return 0;
}

/**
 * Puntos que aporta a un equipo un partido jugado, según la fase, el modo de
 * victoria y si fue el ganador. Función pura (sin DB) para poder testearla.
 *
 * En grupos, un empate da +1 a AMBOS equipos: por eso el caso 'draw' no mira
 * `isWinner`.
 */
export function matchPointsForTeam(
  stage: Stage,
  winMode: WinMode | null,
  isWinner: boolean,
): number {
  if (stage === 'group') {
    if (winMode === 'draw') return DRAW_POINTS;
    return isWinner ? WIN_REGULATION_POINTS : 0;
  }

  // Eliminatorias: solo puntúa el ganador del partido.
  if (!isWinner) return 0;

  // +2 si la victoria fue en los 90' (no en prórroga ni penaltis).
  let pts = winMode === 'regulation' ? WIN_REGULATION_POINTS : 0;

  if (stage === 'final') pts += WORLD_CUP_POINTS;
  else if (stage === 'third_place') pts += THIRD_PLACE_POINTS;
  else if (ADVANCE_STAGES.has(stage)) pts += ADVANCE_POINTS;

  return pts;
}

function addTo(map: Map<number, number>, teamId: number, pts: number): void {
  if (pts !== 0) map.set(teamId, (map.get(teamId) ?? 0) + pts);
}

/** Suma a `teamPoints` lo que aporta `teamId` por un partido jugado. */
function addMatchPoints(teamPoints: Map<number, number>, m: Match, teamId: number | null): void {
  if (teamId == null) return;
  addTo(teamPoints, teamId, matchPointsForTeam(m.stage, m.winMode, m.winnerTeamId === teamId));
}

/**
 * Recalcula los puntos de todas las porras desde cero y los persiste en
 * `entries.points`.
 */
export async function recalcAllPoints(): Promise<void> {
  const [allMatches, allTeams, allEntries, allEntryTeams, allPlayers] = await Promise.all([
    db.select().from(matches),
    db.select().from(teams),
    db.select().from(entries),
    db.select().from(entryTeams),
    db.select().from(players),
  ]);

  // 1) Puntos por equipo: posición de grupo + partidos jugados.
  const teamPoints = new Map<number, number>();
  for (const t of allTeams) {
    teamPoints.set(t.id, groupPositionPoints(t.groupPosition));
  }
  for (const m of allMatches) {
    if (!m.played) continue;
    addMatchPoints(teamPoints, m, m.homeTeamId);
    addMatchPoints(teamPoints, m, m.awayTeamId);
  }

  // 2) Índices auxiliares.
  const playerById = new Map(allPlayers.map((p) => [p.id, p]));
  const teamIdsByEntry = new Map<number, number[]>();
  for (const et of allEntryTeams) {
    const arr = teamIdsByEntry.get(et.entryId);
    if (arr) arr.push(et.teamId);
    else teamIdsByEntry.set(et.entryId, [et.teamId]);
  }

  // 3) Puntos por porra: suma de sus equipos + goleador.
  await Promise.all(
    allEntries.map((entry) => {
      let pts = 0;
      for (const tid of teamIdsByEntry.get(entry.id) ?? []) {
        pts += teamPoints.get(tid) ?? 0;
      }
      const gb = playerById.get(entry.goldenBootPlayerId);
      if (gb) {
        pts += gb.goals * GOLDEN_BOOT_GOAL_POINTS;
        if (gb.isGoldenBoot) pts += GOLDEN_BOOT_WINNER_POINTS;
      }
      // Redondeo a medios puntos para evitar ruido de coma flotante.
      pts = Math.round(pts * 2) / 2;
      return db.update(entries).set({ points: pts }).where(eq(entries.id, entry.id));
    }),
  );
}

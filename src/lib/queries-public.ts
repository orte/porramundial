import { db } from '@/db';
import { entries, entryTeams, matches, players, teams } from '@/db/schema';
import { and, asc, count, desc, eq, inArray, or } from 'drizzle-orm';
import type { Match } from '@/db/schema';
import {
  GOLDEN_BOOT_GOAL_POINTS,
  GOLDEN_BOOT_WINNER_POINTS,
  groupPositionPoints,
  matchPointsForTeam,
} from '@/lib/scoring';
import {
  getAllAdminMatches,
  getGroupsForAdmin,
  type AdminMatch,
  type GroupTeam,
} from '@/lib/queries-admin';

type Stage = Match['stage'];

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

// ─── CLASIFICACIÓN DE LA PORRA ──────────────────────────────────────────────

export type StandingRow = {
  id: number;
  participantName: string;
  teamName: string;
  points: number;
  totalSpent: number;
  goldenBootName: string;
  goldenBootFlag: string | null;
  goldenBootGoals: number;
  goldenBootIsWinner: boolean;
};

/**
 * Porras ordenadas por puntos desc. Desempate: menos M€ gastados (premia las
 * estrategias arriesgadas), y por último fecha de creación.
 */
export async function getStandings(): Promise<StandingRow[]> {
  return db
    .select({
      id: entries.id,
      participantName: entries.participantName,
      teamName: entries.teamName,
      points: entries.points,
      totalSpent: entries.totalSpent,
      goldenBootName: players.name,
      goldenBootFlag: teams.flag,
      goldenBootGoals: players.goals,
      goldenBootIsWinner: players.isGoldenBoot,
    })
    .from(entries)
    .innerJoin(players, eq(entries.goldenBootPlayerId, players.id))
    .leftJoin(teams, eq(players.teamId, teams.id))
    .orderBy(desc(entries.points), asc(entries.totalSpent), asc(entries.createdAt));
}

// ─── TABLA DE GRUPOS (calculada en runtime) ─────────────────────────────────

export type GroupStandingRow = {
  team: GroupTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type GroupStanding = {
  groupCode: string;
  closed: boolean; // los 4 equipos tienen posición final asignada
  rows: GroupStandingRow[];
};

function emptyRow(team: GroupTeam): GroupStandingRow {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  };
}

function applyResult(row: GroupStandingRow, scored: number, conceded: number): void {
  row.played += 1;
  row.goalsFor += scored;
  row.goalsAgainst += conceded;
  row.goalDiff = row.goalsFor - row.goalsAgainst;
  if (scored > conceded) {
    row.won += 1;
    row.points += 3;
  } else if (scored === conceded) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

export async function getGroupStandings(): Promise<GroupStanding[]> {
  const [groups, allMatches] = await Promise.all([getGroupsForAdmin(), getAllAdminMatches()]);

  // Índice teamId -> fila, inicializado con los 4 equipos de cada grupo.
  const rowByTeam = new Map<number, GroupStandingRow>();
  for (const g of groups) {
    for (const t of g.teams) rowByTeam.set(t.id, emptyRow(t));
  }

  for (const m of allMatches) {
    if (m.stage !== 'group' || !m.played) continue;
    if (m.home == null || m.away == null) continue;
    const home = rowByTeam.get(m.home.id);
    const away = rowByTeam.get(m.away.id);
    if (!home || !away) continue;
    const hg = m.homeGoals ?? 0;
    const ag = m.awayGoals ?? 0;
    applyResult(home, hg, ag);
    applyResult(away, ag, hg);
  }

  return groups.map((g) => {
    const rows = g.teams.map((t) => rowByTeam.get(t.id)!);
    rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.team.name.localeCompare(b.team.name),
    );
    const closed = g.teams.every((t) => t.groupPosition != null);
    return { groupCode: g.groupCode, closed, rows };
  });
}

// ─── ESTADO DEL TORNEO ──────────────────────────────────────────────────────

export type TournamentStatus = {
  matchesPlayed: number;
  total: number;
  currentStage: Stage | null;
  finished: boolean;
};

export async function getTournamentStatus(): Promise<TournamentStatus> {
  const [playedRow, totalRow, nextUnplayed] = await Promise.all([
    db.select({ c: count() }).from(matches).where(eq(matches.played, true)),
    db.select({ c: count() }).from(matches),
    db
      .select({ stage: matches.stage })
      .from(matches)
      .where(eq(matches.played, false))
      .orderBy(asc(matches.kickoff), asc(matches.matchNumber))
      .limit(1),
  ]);

  const matchesPlayed = playedRow[0]?.c ?? 0;
  const total = totalRow[0]?.c ?? 0;
  return {
    matchesPlayed,
    total,
    currentStage: nextUnplayed[0]?.stage ?? null,
    finished: total > 0 && matchesPlayed === total,
  };
}

// ─── ÚLTIMOS RESULTADOS (para la home) ───────────────────────────────────────

export async function getRecentResults(limit = 3): Promise<AdminMatch[]> {
  const all = await getAllAdminMatches();
  return all
    .filter((m) => m.played && m.kickoff != null)
    .sort((a, b) => (b.kickoff!.getTime() - a.kickoff!.getTime()))
    .slice(0, limit);
}

// ─── DESGLOSE DE PUNTOS DE UNA PORRA ─────────────────────────────────────────

export type PointsBreakdown = {
  teamMatches: number; // victorias/empates/avanzar/campeón de las selecciones
  groupPositions: number; // 1º / 2º de grupo
  goldenBootGoals: number; // +3 por gol del goleador
  goldenBootWinner: number; // +4 si es la Bota de Oro
  total: number;
};

/**
 * Desglosa los puntos de una porra por categoría. Usa los mismos helpers puros
 * que recalcAllPoints(), así que el total coincide con entries.points.
 */
export async function getEntryBreakdown(entryId: number): Promise<PointsBreakdown | null> {
  const [entry] = await db.select().from(entries).where(eq(entries.id, entryId)).limit(1);
  if (!entry) return null;

  const ets = await db.select().from(entryTeams).where(eq(entryTeams.entryId, entryId));
  const teamIds = ets.map((e) => e.teamId);

  const [teamRows, playerRow, playedMatches] = await Promise.all([
    teamIds.length
      ? db.select().from(teams).where(inArray(teams.id, teamIds))
      : Promise.resolve([]),
    db.select().from(players).where(eq(players.id, entry.goldenBootPlayerId)).limit(1),
    teamIds.length
      ? db
          .select()
          .from(matches)
          .where(
            and(
              eq(matches.played, true),
              or(inArray(matches.homeTeamId, teamIds), inArray(matches.awayTeamId, teamIds)),
            ),
          )
      : Promise.resolve([]),
  ]);

  const idSet = new Set(teamIds);
  let teamMatches = 0;
  for (const m of playedMatches) {
    if (m.homeTeamId != null && idSet.has(m.homeTeamId)) {
      teamMatches += matchPointsForTeam(m.stage, m.winMode, m.winnerTeamId === m.homeTeamId);
    }
    if (m.awayTeamId != null && idSet.has(m.awayTeamId)) {
      teamMatches += matchPointsForTeam(m.stage, m.winMode, m.winnerTeamId === m.awayTeamId);
    }
  }

  let groupPositions = 0;
  for (const t of teamRows) groupPositions += groupPositionPoints(t.groupPosition);

  const player = playerRow[0];
  const goldenBootGoals = (player?.goals ?? 0) * GOLDEN_BOOT_GOAL_POINTS;
  const goldenBootWinner = player?.isGoldenBoot ? GOLDEN_BOOT_WINNER_POINTS : 0;

  return {
    teamMatches: roundHalf(teamMatches),
    groupPositions: roundHalf(groupPositions),
    goldenBootGoals,
    goldenBootWinner,
    total: roundHalf(teamMatches + groupPositions + goldenBootGoals + goldenBootWinner),
  };
}

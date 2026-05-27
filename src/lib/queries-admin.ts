import { db } from '@/db';
import { config, entries, entryTeams, matches, players, teams } from '@/db/schema';
import { alias } from 'drizzle-orm/pg-core';
import { and, asc, count, desc, eq, isNotNull, sql } from 'drizzle-orm';
import type { Match } from '@/db/schema';
import { getLockDate } from '@/lib/lock';

type Stage = Match['stage'];
type WinMode = NonNullable<Match['winMode']>;

const homeTeam = alias(teams, 'home_team');
const awayTeam = alias(teams, 'away_team');

export type TeamRef = {
  id: number;
  name: string;
  flag: string;
  code: string;
};

export type AdminMatch = {
  id: number;
  matchNumber: number;
  stage: Stage;
  groupCode: string | null;
  kickoff: Date | null;
  venue: string | null;
  played: boolean;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  homeGoalsAfterExtra: number | null;
  awayGoalsAfterExtra: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  winMode: WinMode | null;
  winnerTeamId: number | null;
  home: TeamRef | null;
  away: TeamRef | null;
};

// Con leftJoin, Drizzle tipa cada objeto de equipo como `TeamRef | null`.
function mapMatchRow(r: { match: Match; home: TeamRef | null; away: TeamRef | null }): AdminMatch {
  const m = r.match;
  return {
    id: m.id,
    matchNumber: m.matchNumber,
    stage: m.stage,
    groupCode: m.groupCode,
    kickoff: m.kickoff,
    venue: m.venue,
    played: m.played,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    homePlaceholder: m.homePlaceholder,
    awayPlaceholder: m.awayPlaceholder,
    homeGoals: m.homeGoals,
    awayGoals: m.awayGoals,
    homeGoalsAfterExtra: m.homeGoalsAfterExtra,
    awayGoalsAfterExtra: m.awayGoalsAfterExtra,
    homePenalties: m.homePenalties,
    awayPenalties: m.awayPenalties,
    winMode: m.winMode,
    winnerTeamId: m.winnerTeamId,
    home: r.home,
    away: r.away,
  };
}

const matchSelection = {
  match: matches,
  home: {
    id: homeTeam.id,
    name: homeTeam.name,
    flag: homeTeam.flag,
    code: homeTeam.code,
  },
  away: {
    id: awayTeam.id,
    name: awayTeam.name,
    flag: awayTeam.flag,
    code: awayTeam.code,
  },
};

export async function getAllAdminMatches(): Promise<AdminMatch[]> {
  const rows = await db
    .select(matchSelection)
    .from(matches)
    .leftJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
    .leftJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
    .orderBy(asc(matches.kickoff), asc(matches.matchNumber));
  return rows.map(mapMatchRow);
}

/** Solo los cruces de eliminatorias (para /admin/eliminatorias). */
export async function getKnockoutMatches(): Promise<AdminMatch[]> {
  const rows = await db
    .select(matchSelection)
    .from(matches)
    .leftJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
    .leftJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
    .where(sql`${matches.stage} <> 'group'`)
    .orderBy(asc(matches.matchNumber));
  return rows.map(mapMatchRow);
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export type DashboardData = {
  matchesPlayed: number;
  matchesPending: number; // con ambos equipos, sin jugar
  matchesUnassigned: number; // sin alguno de los equipos
  groupsClosed: number; // grupos con los 4 equipos posicionados
  entriesCount: number;
  upcoming: AdminMatch[];
  lockDate: Date;
  isLocked: boolean;
};

export async function getDashboardData(): Promise<DashboardData> {
  const [
    playedRow,
    pendingRow,
    unassignedRow,
    entriesRow,
    positionedRow,
    upcomingRows,
    lockDate,
  ] = await Promise.all([
    db.select({ c: count() }).from(matches).where(eq(matches.played, true)),
    db
      .select({ c: count() })
      .from(matches)
      .where(
        and(eq(matches.played, false), isNotNull(matches.homeTeamId), isNotNull(matches.awayTeamId)),
      ),
    db
      .select({ c: count() })
      .from(matches)
      .where(sql`${matches.homeTeamId} is null or ${matches.awayTeamId} is null`),
    db.select({ c: count() }).from(entries),
    // equipos con posición de grupo asignada, agrupados por grupo
    db
      .select({ groupCode: teams.groupCode, c: count() })
      .from(teams)
      .where(isNotNull(teams.groupPosition))
      .groupBy(teams.groupCode),
    db
      .select(matchSelection)
      .from(matches)
      .leftJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
      .leftJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
      .where(
        and(
          eq(matches.played, false),
          isNotNull(matches.homeTeamId),
          isNotNull(matches.awayTeamId),
        ),
      )
      .orderBy(asc(matches.kickoff))
      .limit(5),
    getLockDate(),
  ]);

  const groupsClosed = positionedRow.filter((g) => g.c === 4).length;

  return {
    matchesPlayed: playedRow[0]?.c ?? 0,
    matchesPending: pendingRow[0]?.c ?? 0,
    matchesUnassigned: unassignedRow[0]?.c ?? 0,
    groupsClosed,
    entriesCount: entriesRow[0]?.c ?? 0,
    upcoming: upcomingRows.map(mapMatchRow),
    lockDate,
    isLocked: new Date() >= lockDate,
  };
}

// ─── GRUPOS ───────────────────────────────────────────────────────────────

export type GroupTeam = {
  id: number;
  name: string;
  flag: string;
  code: string;
  price: number;
  groupPosition: number | null;
  eliminated: boolean;
};

export type AdminGroup = {
  groupCode: string;
  teams: GroupTeam[];
};

export async function getGroupsForAdmin(): Promise<AdminGroup[]> {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      flag: teams.flag,
      code: teams.code,
      price: teams.price,
      groupCode: teams.groupCode,
      groupPosition: teams.groupPosition,
      eliminated: teams.eliminated,
    })
    .from(teams)
    .orderBy(asc(teams.groupCode), asc(teams.groupPosition), desc(teams.price));

  const byGroup = new Map<string, GroupTeam[]>();
  for (const r of rows) {
    const arr = byGroup.get(r.groupCode);
    const team: GroupTeam = {
      id: r.id,
      name: r.name,
      flag: r.flag,
      code: r.code,
      price: r.price,
      groupPosition: r.groupPosition,
      eliminated: r.eliminated,
    };
    if (arr) arr.push(team);
    else byGroup.set(r.groupCode, [team]);
  }

  return [...byGroup.entries()]
    .map(([groupCode, t]) => ({ groupCode, teams: t }))
    .sort((a, b) => a.groupCode.localeCompare(b.groupCode));
}

// ─── GOLEADORES ─────────────────────────────────────────────────────────────

export type AdminScorer = {
  id: number;
  name: string;
  price: number;
  goals: number;
  isCustom: boolean;
  isGoldenBoot: boolean;
  teamName: string | null;
  teamFlag: string | null;
  pickedBy: number; // nº de porras que lo eligieron
};

export async function getScorersForAdmin(): Promise<AdminScorer[]> {
  // nº de porras por goleador
  const picks = await db
    .select({ playerId: entries.goldenBootPlayerId, c: count() })
    .from(entries)
    .groupBy(entries.goldenBootPlayerId);
  const picksByPlayer = new Map(picks.map((p) => [p.playerId, p.c]));

  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      price: players.price,
      goals: players.goals,
      isCustom: players.isCustom,
      isGoldenBoot: players.isGoldenBoot,
      teamName: teams.name,
      teamFlag: teams.flag,
    })
    .from(players)
    .leftJoin(teams, eq(players.teamId, teams.id))
    .orderBy(desc(players.price), asc(players.name));

  return rows.map((r) => ({
    ...r,
    pickedBy: picksByPlayer.get(r.id) ?? 0,
  }));
}

// ─── PORRAS ───────────────────────────────────────────────────────────────

export type AdminEntry = {
  id: number;
  participantName: string;
  teamName: string;
  points: number;
  totalSpent: number;
  goldenBootName: string;
  goldenBootFlag: string | null;
  createdAt: Date;
};

export async function getEntriesForAdmin(): Promise<AdminEntry[]> {
  return db
    .select({
      id: entries.id,
      participantName: entries.participantName,
      teamName: entries.teamName,
      points: entries.points,
      totalSpent: entries.totalSpent,
      goldenBootName: players.name,
      goldenBootFlag: teams.flag,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .innerJoin(players, eq(entries.goldenBootPlayerId, players.id))
    .leftJoin(teams, eq(players.teamId, teams.id))
    .orderBy(desc(entries.points), desc(entries.createdAt));
}

// ─── EQUIPOS (para selects de eliminatorias) ────────────────────────────────

export async function getAllTeamsRef(): Promise<(TeamRef & { groupCode: string })[]> {
  return db
    .select({
      id: teams.id,
      name: teams.name,
      flag: teams.flag,
      code: teams.code,
      groupCode: teams.groupCode,
    })
    .from(teams)
    .orderBy(asc(teams.groupCode), asc(teams.name));
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────

export async function getConfigValue(key: string): Promise<string | null> {
  const [row] = await db.select().from(config).where(eq(config.key, key)).limit(1);
  return row?.value ?? null;
}

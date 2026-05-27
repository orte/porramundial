import { db } from '@/db';
import { players, teams } from '@/db/schema';
import { asc, desc, eq } from 'drizzle-orm';

export type TeamForPicker = {
  id: number;
  name: string;
  code: string;
  flag: string;
  price: number;
  groupCode: string;
};

export type PlayerForPicker = {
  id: number;
  name: string;
  price: number;
  teamFlag: string | null;
  teamName: string | null;
  isCustom: boolean;
};

export async function getAllTeams(): Promise<TeamForPicker[]> {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      code: teams.code,
      flag: teams.flag,
      price: teams.price,
      groupCode: teams.groupCode,
    })
    .from(teams)
    .orderBy(desc(teams.price), asc(teams.name));
  return rows;
}

export async function getAllPlayers(): Promise<PlayerForPicker[]> {
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      price: players.price,
      isCustom: players.isCustom,
      teamFlag: teams.flag,
      teamName: teams.name,
    })
    .from(players)
    .leftJoin(teams, eq(players.teamId, teams.id))
    .orderBy(desc(players.price), asc(players.name));
  return rows;
}

import { db } from '@/db';
import { entries, entryTeams, players, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type EntryWithDetails = {
  id: number;
  participantName: string;
  teamName: string;
  /** Privado: solo se usa para el email de edición y se muestra únicamente al dueño. */
  email: string;
  totalSpent: number;
  points: number;
  editToken: string;
  createdAt: Date;
  goldenBoot: {
    id: number;
    name: string;
    price: number;
    isCustom: boolean;
    teamFlag: string | null;
    teamName: string | null;
  };
  teams: {
    id: number;
    name: string;
    flag: string;
    code: string;
    price: number;
    groupCode: string;
  }[];
};

export async function getEntryById(id: number): Promise<EntryWithDetails | null> {
  const [entry] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);
  if (!entry) return null;

  // Goleador (con info del equipo si no es custom)
  const [goldenBoot] = await db
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
    .where(eq(players.id, entry.goldenBootPlayerId))
    .limit(1);

  if (!goldenBoot) return null;

  // Las 5 selecciones
  const selected = await db
    .select({
      id: teams.id,
      name: teams.name,
      flag: teams.flag,
      code: teams.code,
      price: teams.price,
      groupCode: teams.groupCode,
    })
    .from(entryTeams)
    .innerJoin(teams, eq(entryTeams.teamId, teams.id))
    .where(eq(entryTeams.entryId, id));

  return {
    id: entry.id,
    participantName: entry.participantName,
    teamName: entry.teamName,
    email: entry.email,
    totalSpent: entry.totalSpent,
    points: entry.points,
    editToken: entry.editToken,
    createdAt: entry.createdAt,
    goldenBoot,
    teams: selected,
  };
}

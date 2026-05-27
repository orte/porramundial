'use server';

import { db } from '@/db';
import { entries, entryTeams, players, teams } from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  BUDGET,
  MAX_CUSTOM_PLAYER_NAME,
  MAX_PARTICIPANT_NAME,
  MAX_TEAM_NAME,
  MAX_TEAMS_BUDGET,
  MIN_PARTICIPANT_NAME,
  MIN_TEAM_NAME,
  TEAMS_TO_PICK,
} from '@/lib/constants';
import { isLocked } from '@/lib/lock';
import { generateEditToken } from '@/lib/token';

export type EntryFormInput = {
  participantName: string;
  teamName: string;
  selectedTeamIds: number[];
  goldenBootChoice:
    | { type: 'preset'; playerId: number }
    | { type: 'custom'; name: string };
};

export type ActionResult =
  | { ok: true; entryId: number; editToken: string }
  | { ok: false; error: string };

// ─── VALIDACIÓN ──────────────────────────────────────────────────────────

function validateInput(input: EntryFormInput): string | null {
  const name = input.participantName?.trim();
  const team = input.teamName?.trim();

  if (!name || name.length < MIN_PARTICIPANT_NAME) {
    return `El nombre debe tener al menos ${MIN_PARTICIPANT_NAME} caracteres.`;
  }
  if (name.length > MAX_PARTICIPANT_NAME) {
    return `El nombre no puede superar los ${MAX_PARTICIPANT_NAME} caracteres.`;
  }
  if (!team || team.length < MIN_TEAM_NAME) {
    return `El nombre del equipo debe tener al menos ${MIN_TEAM_NAME} caracteres.`;
  }
  if (team.length > MAX_TEAM_NAME) {
    return `El nombre del equipo no puede superar los ${MAX_TEAM_NAME} caracteres.`;
  }
  if (!Array.isArray(input.selectedTeamIds) || input.selectedTeamIds.length !== TEAMS_TO_PICK) {
    return `Tienes que elegir exactamente ${TEAMS_TO_PICK} selecciones.`;
  }
  if (new Set(input.selectedTeamIds).size !== TEAMS_TO_PICK) {
    return 'No puedes elegir la misma selección dos veces.';
  }

  if (input.goldenBootChoice.type === 'preset') {
    if (!Number.isInteger(input.goldenBootChoice.playerId)) {
      return 'Candidato a Bota de Oro inválido.';
    }
  } else {
    const custom = input.goldenBootChoice.name?.trim();
    if (!custom || custom.length < 2) {
      return 'Escribe el nombre del jugador.';
    }
    if (custom.length > MAX_CUSTOM_PLAYER_NAME) {
      return `El nombre del jugador no puede superar los ${MAX_CUSTOM_PLAYER_NAME} caracteres.`;
    }
  }

  return null;
}

// ─── CREATE ──────────────────────────────────────────────────────────────

export async function createEntry(input: EntryFormInput): Promise<ActionResult> {
  // Bloqueo: si ya empezó el Mundial, no se aceptan nuevas porras.
  if (await isLocked()) {
    return { ok: false, error: 'Las porras ya están bloqueadas: el Mundial ha comenzado.' };
  }

  const validation = validateInput(input);
  if (validation) return { ok: false, error: validation };

  // Cargo los equipos elegidos para verificar precios y existencia.
  const chosenTeams = await db
    .select()
    .from(teams)
    .where(inArray(teams.id, input.selectedTeamIds));

  if (chosenTeams.length !== TEAMS_TO_PICK) {
    return { ok: false, error: 'Alguna de las selecciones elegidas no existe.' };
  }

  const teamsCost = chosenTeams.reduce((acc, t) => acc + t.price, 0);

  // Validamos que el gasto en equipos no supere MAX_TEAMS_BUDGET, reservando
  // 1M€ para el candidato a Bota de Oro.
  if (teamsCost > MAX_TEAMS_BUDGET) {
    return {
      ok: false,
      error: `Has gastado ${teamsCost}M€ en selecciones. El máximo es ${MAX_TEAMS_BUDGET}M€ (se reserva 1M€ para el goleador).`,
    };
  }

  // Resolver el jugador Bota de Oro
  let goldenBootPlayerId: number;
  let playerCost: number;

  if (input.goldenBootChoice.type === 'preset') {
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, input.goldenBootChoice.playerId))
      .limit(1);
    if (!player || player.isCustom) {
      return { ok: false, error: 'El jugador seleccionado no es válido.' };
    }
    goldenBootPlayerId = player.id;
    playerCost = player.price;
  } else {
    // "Otro": creamos un player custom con precio 1
    playerCost = 1;
    const customName = input.goldenBootChoice.name.trim();
    const [created] = await db
      .insert(players)
      .values({
        name: customName,
        teamId: null,
        price: 1,
        isCustom: true,
      })
      .returning();
    if (!created) {
      return { ok: false, error: 'No se pudo crear el jugador custom.' };
    }
    goldenBootPlayerId = created.id;
  }

  const totalSpent = teamsCost + playerCost;

  if (totalSpent > BUDGET) {
    return {
      ok: false,
      error: `Te has pasado del presupuesto: ${totalSpent}M€ de ${BUDGET}M€.`,
    };
  }

  const editToken = generateEditToken();

  // Insertar la porra
  const [entry] = await db
    .insert(entries)
    .values({
      participantName: input.participantName.trim(),
      teamName: input.teamName.trim(),
      editToken,
      goldenBootPlayerId,
      totalSpent,
    })
    .returning();

  if (!entry) {
    return { ok: false, error: 'No se pudo crear la porra. Inténtalo de nuevo.' };
  }

  // Insertar las 5 selecciones
  await db.insert(entryTeams).values(
    input.selectedTeamIds.map((teamId) => ({
      entryId: entry.id,
      teamId,
    })),
  );

  // Guardamos el token en cookie para edición posterior
  const cookieStore = await cookies();
  cookieStore.set({
    name: `porra_token_${entry.id}`,
    value: editToken,
    httpOnly: false, // queremos que sea legible desde cliente para mostrar "Editar"
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 60, // 60 días
    path: '/',
  });

  revalidatePath('/');
  revalidatePath('/clasificacion');

  return { ok: true, entryId: entry.id, editToken };
}

// ─── UPDATE ──────────────────────────────────────────────────────────────

export async function updateEntry(
  entryId: number,
  editToken: string,
  input: EntryFormInput,
): Promise<ActionResult> {
  if (await isLocked()) {
    return { ok: false, error: 'Las porras ya están bloqueadas: el Mundial ha comenzado.' };
  }

  // Verificar que la porra existe y el token coincide
  const [existing] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);

  if (!existing) return { ok: false, error: 'La porra no existe.' };
  if (existing.editToken !== editToken) {
    return { ok: false, error: 'No tienes permiso para editar esta porra.' };
  }

  const validation = validateInput(input);
  if (validation) return { ok: false, error: validation };

  const chosenTeams = await db
    .select()
    .from(teams)
    .where(inArray(teams.id, input.selectedTeamIds));

  if (chosenTeams.length !== TEAMS_TO_PICK) {
    return { ok: false, error: 'Alguna de las selecciones elegidas no existe.' };
  }

  const teamsCost = chosenTeams.reduce((acc, t) => acc + t.price, 0);

  if (teamsCost > MAX_TEAMS_BUDGET) {
    return {
      ok: false,
      error: `Has gastado ${teamsCost}M€ en selecciones. El máximo es ${MAX_TEAMS_BUDGET}M€ (se reserva 1M€ para el goleador).`,
    };
  }

  let goldenBootPlayerId: number;
  let playerCost: number;

  if (input.goldenBootChoice.type === 'preset') {
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, input.goldenBootChoice.playerId))
      .limit(1);
    if (!player || player.isCustom) {
      return { ok: false, error: 'El jugador seleccionado no es válido.' };
    }
    goldenBootPlayerId = player.id;
    playerCost = player.price;
  } else {
    playerCost = 1;
    const customName = input.goldenBootChoice.name.trim();
    // Si el goleador anterior era custom y no lo usa nadie más, lo reutilizamos
    const [previousPlayer] = await db
      .select()
      .from(players)
      .where(eq(players.id, existing.goldenBootPlayerId))
      .limit(1);

    if (previousPlayer?.isCustom) {
      // Comprobar si alguna otra porra lo está usando
      const others = await db
        .select({ id: entries.id })
        .from(entries)
        .where(and(eq(entries.goldenBootPlayerId, previousPlayer.id), sql`${entries.id} != ${entryId}`))
        .limit(1);
      if (others.length === 0) {
        await db.update(players).set({ name: customName }).where(eq(players.id, previousPlayer.id));
        goldenBootPlayerId = previousPlayer.id;
      } else {
        const [created] = await db
          .insert(players)
          .values({ name: customName, teamId: null, price: 1, isCustom: true })
          .returning();
        goldenBootPlayerId = created!.id;
      }
    } else {
      const [created] = await db
        .insert(players)
        .values({ name: customName, teamId: null, price: 1, isCustom: true })
        .returning();
      goldenBootPlayerId = created!.id;
    }
  }

  const totalSpent = teamsCost + playerCost;
  if (totalSpent > BUDGET) {
    return { ok: false, error: `Te has pasado del presupuesto: ${totalSpent}M€ de ${BUDGET}M€.` };
  }

  // Actualizar la porra
  await db
    .update(entries)
    .set({
      participantName: input.participantName.trim(),
      teamName: input.teamName.trim(),
      goldenBootPlayerId,
      totalSpent,
      updatedAt: new Date(),
    })
    .where(eq(entries.id, entryId));

  // Reemplazar las selecciones
  await db.delete(entryTeams).where(eq(entryTeams.entryId, entryId));
  await db.insert(entryTeams).values(
    input.selectedTeamIds.map((teamId) => ({ entryId, teamId })),
  );

  revalidatePath(`/porra/${entryId}`);
  revalidatePath('/clasificacion');

  return { ok: true, entryId, editToken };
}

// ─── REDIRECT HELPER ─────────────────────────────────────────────────────

export async function redirectToEntry(entryId: number) {
  redirect(`/porra/${entryId}`);
}

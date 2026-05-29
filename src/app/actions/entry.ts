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
import { getLockDate, isLocked } from '@/lib/lock';
import { generateEditToken } from '@/lib/token';
import { getEntryById } from '@/lib/queries-entry';
import { sendEntryEmail } from '@/lib/email';

/** Validación básica de formato de email (defensa en profundidad; el cliente ya valida). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 120;

export type EntryFormInput = {
  participantName: string;
  teamName: string;
  email: string;
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
    return `Izenak gutxienez ${MIN_PARTICIPANT_NAME} karaktere izan behar ditu.`;
  }
  if (name.length > MAX_PARTICIPANT_NAME) {
    return `Izenak ezin ditu ${MAX_PARTICIPANT_NAME} karaktere baino gehiago izan.`;
  }
  if (!team || team.length < MIN_TEAM_NAME) {
    return `Taldearen izenak gutxienez ${MIN_TEAM_NAME} karaktere izan behar ditu.`;
  }
  if (team.length > MAX_TEAM_NAME) {
    return `Taldearen izenak ezin ditu ${MAX_TEAM_NAME} karaktere baino gehiago izan.`;
  }
  const email = input.email?.trim();
  if (!email || !EMAIL_REGEX.test(email)) {
    return 'Email helbide baliozko bat sartu behar duzu.';
  }
  if (email.length > MAX_EMAIL) {
    return `Emailak ezin ditu ${MAX_EMAIL} karaktere baino gehiago izan.`;
  }
  if (!Array.isArray(input.selectedTeamIds) || input.selectedTeamIds.length !== TEAMS_TO_PICK) {
    return `Zehazki ${TEAMS_TO_PICK} selekzio aukeratu behar dituzu.`;
  }
  if (new Set(input.selectedTeamIds).size !== TEAMS_TO_PICK) {
    return 'Ezin duzu selekzio bera bi aldiz aukeratu.';
  }

  if (input.goldenBootChoice.type === 'preset') {
    if (!Number.isInteger(input.goldenBootChoice.playerId)) {
      return 'Urrezko Bota hautagai baliogabea.';
    }
  } else {
    const custom = input.goldenBootChoice.name?.trim();
    if (!custom || custom.length < 2) {
      return 'Idatzi jokalariaren izena.';
    }
    if (custom.length > MAX_CUSTOM_PLAYER_NAME) {
      return `Jokalariaren izenak ezin ditu ${MAX_CUSTOM_PLAYER_NAME} karaktere baino gehiago izan.`;
    }
  }

  return null;
}

// ─── EMAIL (no debe romper la creación/edición) ───────────────────────────

/** URL base del sitio para construir el enlace mágico absoluto. */
function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Envía el email de confirmación/actualización reutilizando los datos ya
 * formateados de la porra. CRÍTICO: cualquier fallo se loguea pero NO se
 * propaga — la porra ya está guardada y el email es solo un extra.
 */
async function sendEntryEmailSafe(
  entryId: number,
  editToken: string,
  email: string,
  isUpdate: boolean,
): Promise<void> {
  try {
    const detail = await getEntryById(entryId);
    if (!detail) return;
    const lockDate = await getLockDate();
    await sendEntryEmail({
      to: email,
      participantName: detail.participantName,
      teamName: detail.teamName,
      teams: detail.teams.map((t) => ({
        name: t.name,
        flag: t.flag,
        price: t.price,
        groupCode: t.groupCode,
      })),
      goldenBoot: {
        name: detail.goldenBoot.name,
        isCustom: detail.goldenBoot.isCustom,
        teamFlag: detail.goldenBoot.teamFlag,
        teamName: detail.goldenBoot.teamName,
        price: detail.goldenBoot.price,
      },
      totalSpent: detail.totalSpent,
      magicLink: `${siteBaseUrl()}/porra/${entryId}?token=${editToken}`,
      lockDate,
      isUpdate,
    });
  } catch (err) {
    console.error(`Error enviando email de porra ${entryId}:`, err);
  }
}

// ─── CREATE ──────────────────────────────────────────────────────────────

export async function createEntry(input: EntryFormInput): Promise<ActionResult> {
  // Bloqueo: si ya empezó el Mundial, no se aceptan nuevas porras.
  if (await isLocked()) {
    return { ok: false, error: 'Porrak blokeatuta daude jada: Mundiala hasi da.' };
  }

  const validation = validateInput(input);
  if (validation) return { ok: false, error: validation };

  // Cargo los equipos elegidos para verificar precios y existencia.
  const chosenTeams = await db
    .select()
    .from(teams)
    .where(inArray(teams.id, input.selectedTeamIds));

  if (chosenTeams.length !== TEAMS_TO_PICK) {
    return { ok: false, error: 'Aukeratutako selekzioren bat ez da existitzen.' };
  }

  const teamsCost = chosenTeams.reduce((acc, t) => acc + t.price, 0);

  // Validamos que el gasto en equipos no supere MAX_TEAMS_BUDGET, reservando
  // 1M€ para el candidato a Bota de Oro.
  if (teamsCost > MAX_TEAMS_BUDGET) {
    return {
      ok: false,
      error: `${teamsCost}M€ gastatu dituzu selekzioetan. Gehienez ${MAX_TEAMS_BUDGET}M€ izan daitezke (1M€ golegilearentzat gordetzen da).`,
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
      return { ok: false, error: 'Aukeratutako jokalaria ez da baliozkoa.' };
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
      return { ok: false, error: 'Ezin izan da jokalari pertsonalizatua sortu.' };
    }
    goldenBootPlayerId = created.id;
  }

  const totalSpent = teamsCost + playerCost;

  if (totalSpent > BUDGET) {
    return {
      ok: false,
      error: `Aurrekontua gainditu duzu: ${totalSpent}M€ / ${BUDGET}M€.`,
    };
  }

  const editToken = generateEditToken();

  // Insertar la porra
  const [entry] = await db
    .insert(entries)
    .values({
      participantName: input.participantName.trim(),
      teamName: input.teamName.trim(),
      email: input.email.trim(),
      editToken,
      goldenBootPlayerId,
      totalSpent,
    })
    .returning();

  if (!entry) {
    return { ok: false, error: 'Ezin izan da porra sortu. Saiatu berriro.' };
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

  // Email de confirmación (no bloquea ni rompe la creación si falla).
  await sendEntryEmailSafe(entry.id, editToken, input.email.trim(), false);

  return { ok: true, entryId: entry.id, editToken };
}

// ─── UPDATE ──────────────────────────────────────────────────────────────

export async function updateEntry(
  entryId: number,
  editToken: string,
  input: EntryFormInput,
): Promise<ActionResult> {
  if (await isLocked()) {
    return { ok: false, error: 'Porrak blokeatuta daude jada: Mundiala hasi da.' };
  }

  // Verificar que la porra existe y el token coincide
  const [existing] = await db
    .select()
    .from(entries)
    .where(eq(entries.id, entryId))
    .limit(1);

  if (!existing) return { ok: false, error: 'Porra hau ez da existitzen.' };
  if (existing.editToken !== editToken) {
    return { ok: false, error: 'Ez duzu porra hau editatzeko baimenik.' };
  }

  const validation = validateInput(input);
  if (validation) return { ok: false, error: validation };

  const chosenTeams = await db
    .select()
    .from(teams)
    .where(inArray(teams.id, input.selectedTeamIds));

  if (chosenTeams.length !== TEAMS_TO_PICK) {
    return { ok: false, error: 'Aukeratutako selekzioren bat ez da existitzen.' };
  }

  const teamsCost = chosenTeams.reduce((acc, t) => acc + t.price, 0);

  if (teamsCost > MAX_TEAMS_BUDGET) {
    return {
      ok: false,
      error: `${teamsCost}M€ gastatu dituzu selekzioetan. Gehienez ${MAX_TEAMS_BUDGET}M€ izan daitezke (1M€ golegilearentzat gordetzen da).`,
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
      return { ok: false, error: 'Aukeratutako jokalaria ez da baliozkoa.' };
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
      email: input.email.trim(),
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

  // Email de "porra actualizada" (no bloquea ni rompe la edición si falla).
  await sendEntryEmailSafe(entryId, editToken, input.email.trim(), true);

  return { ok: true, entryId, editToken };
}

// ─── REDIRECT HELPER ─────────────────────────────────────────────────────

export async function redirectToEntry(entryId: number) {
  redirect(`/porra/${entryId}`);
}

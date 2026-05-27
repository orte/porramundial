/**
 * Pobla la base de datos con:
 *  - 48 selecciones con precios
 *  - 21 jugadores (20 candidatos + plantilla "Otro")
 *  - 104 partidos del calendario
 *
 * Uso:
 *   1) Asegúrate de tener DATABASE_URL en .env
 *   2) Ejecuta migrations: pnpm db:push (o pnpm db:migrate)
 *   3) Ejecuta este seed: pnpm db:seed
 *
 * El seed es idempotente: si ya existen datos, los actualiza por code/matchNumber.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, sql } from 'drizzle-orm';
import * as schema from './schema';
import { TEAMS } from './seed-teams';
import { PLAYERS } from './seed-players';
import { MATCHES } from './seed-matches';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida. Mira .env.example');
}

const client = neon(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function seedTeams() {
  console.log('🌱 Sembrando selecciones...');
  for (const team of TEAMS) {
    await db
      .insert(schema.teams)
      .values({
        name: team.name,
        code: team.code,
        flag: team.flag,
        price: team.price,
        groupCode: team.groupCode,
      })
      .onConflictDoUpdate({
        target: schema.teams.code,
        set: {
          name: team.name,
          flag: team.flag,
          price: team.price,
          groupCode: team.groupCode,
        },
      });
  }
  console.log(`   ✓ ${TEAMS.length} selecciones`);
}

async function seedPlayers() {
  console.log('🌱 Sembrando jugadores...');
  // Limpio jugadores no-custom para evitar duplicados (los custom los crea el usuario)
  await db.delete(schema.players).where(eq(schema.players.isCustom, false));

  // También borro la fila "Otro (especificar)" si existiera de un seed anterior
  await db
    .delete(schema.players)
    .where(sql`${schema.players.name} = 'Otro (especificar)'`);

  for (const p of PLAYERS) {
    let teamId: number | null = null;
    if (p.teamCode) {
      const [team] = await db
        .select()
        .from(schema.teams)
        .where(eq(schema.teams.code, p.teamCode))
        .limit(1);
      if (!team) {
        throw new Error(`No se encontró el equipo ${p.teamCode} para ${p.name}`);
      }
      teamId = team.id;
    }

    await db.insert(schema.players).values({
      name: p.name,
      teamId,
      price: p.price,
      isCustom: p.isCustom ?? false,
    });
  }
  console.log(`   ✓ ${PLAYERS.length} jugadores`);
}

async function seedMatches() {
  console.log('🌱 Sembrando partidos...');

  // Cacheo de IDs de equipos por código
  const allTeams = await db.select().from(schema.teams);
  const teamIdByCode = new Map(allTeams.map((t) => [t.code, t.id]));

  for (const m of MATCHES) {
    const homeTeamId = m.homeTeamCode ? teamIdByCode.get(m.homeTeamCode) : null;
    const awayTeamId = m.awayTeamCode ? teamIdByCode.get(m.awayTeamCode) : null;

    if (m.homeTeamCode && !homeTeamId) {
      throw new Error(`Equipo home ${m.homeTeamCode} no encontrado (partido ${m.matchNumber})`);
    }
    if (m.awayTeamCode && !awayTeamId) {
      throw new Error(`Equipo away ${m.awayTeamCode} no encontrado (partido ${m.matchNumber})`);
    }

    const values = {
      matchNumber: m.matchNumber,
      stage: m.stage,
      groupCode: m.groupCode ?? null,
      homeTeamId: homeTeamId ?? null,
      awayTeamId: awayTeamId ?? null,
      homePlaceholder: m.homePlaceholder ?? null,
      awayPlaceholder: m.awayPlaceholder ?? null,
      kickoff: m.kickoffISO ? new Date(m.kickoffISO) : null,
      venue: m.venue ?? null,
    };

    await db
      .insert(schema.matches)
      .values(values)
      .onConflictDoUpdate({
        target: schema.matches.matchNumber,
        set: {
          stage: values.stage,
          groupCode: values.groupCode,
          homeTeamId: values.homeTeamId,
          awayTeamId: values.awayTeamId,
          homePlaceholder: values.homePlaceholder,
          awayPlaceholder: values.awayPlaceholder,
          kickoff: values.kickoff,
          venue: values.venue,
        },
      });
  }
  console.log(`   ✓ ${MATCHES.length} partidos`);
}

async function seedConfig() {
  console.log('🌱 Sembrando configuración...');
  const lockDate = process.env.LOCK_DATE ?? '2026-06-11T17:00:00.000Z';
  await db
    .insert(schema.config)
    .values({ key: 'lock_date', value: lockDate })
    .onConflictDoUpdate({
      target: schema.config.key,
      set: { value: lockDate },
    });
  console.log(`   ✓ lock_date = ${lockDate}`);
}

async function main() {
  console.log('═════════════════════════════════════════');
  console.log('  Seed Porra Mundial 2026');
  console.log('═════════════════════════════════════════');
  await seedTeams();
  await seedPlayers();
  await seedMatches();
  await seedConfig();
  console.log('═════════════════════════════════════════');
  console.log('✅ Seed completado');
  console.log('═════════════════════════════════════════');
}

main().catch((err) => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});

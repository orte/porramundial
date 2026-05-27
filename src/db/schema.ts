import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  doublePrecision,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export const stageEnum = pgEnum('stage', [
  'group',
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'third_place',
  'final',
]);

export const matchWinModeEnum = pgEnum('match_win_mode', [
  'regulation', // ganador en los 90'
  'extra_time', // ganador en la prórroga
  'penalties', // ganador en penaltis
  'draw', // solo aplica a fase de grupos
]);

// ─── SELECCIONES ──────────────────────────────────────────────────────────────

export const teams = pgTable(
  'teams',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(), // "España"
    code: text('code').notNull(), // ISO-ish, "ESP"
    flag: text('flag').notNull(), // emoji bandera, "🇪🇸"
    price: integer('price').notNull(), // en millones €
    groupCode: text('group_code').notNull(), // "A".."L"
    // Stats de fase de grupos (las rellena el admin/se calculan)
    groupPosition: integer('group_position'), // 1, 2, 3 o 4 (null hasta acabar fase de grupos)
    eliminated: boolean('eliminated').notNull().default(false),
  },
  (t) => ({
    codeIdx: uniqueIndex('teams_code_idx').on(t.code),
  }),
);

// ─── JUGADORES (candidatos a Bota de Oro) ─────────────────────────────────────

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  teamId: integer('team_id').references(() => teams.id),
  price: integer('price').notNull(), // 10, 5, 2 o 1 (para "Otro")
  isCustom: boolean('is_custom').notNull().default(false), // true si se creó vía "Otro"
  goals: integer('goals').notNull().default(0), // goles marcados en el torneo
  isGoldenBoot: boolean('is_golden_boot').notNull().default(false), // se marca al final
});

// ─── PARTIDOS ─────────────────────────────────────────────────────────────────

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  matchNumber: integer('match_number').notNull().unique(), // 1..104
  stage: stageEnum('stage').notNull(),
  groupCode: text('group_code'), // "A".."L" solo en fase de grupos
  // Equipos. Pueden ser null en las eliminatorias hasta saber el cruce.
  homeTeamId: integer('home_team_id').references(() => teams.id),
  awayTeamId: integer('away_team_id').references(() => teams.id),
  // Slots para mostrar cuando aún no se sabe el equipo (ej: "1A vs 2B")
  homePlaceholder: text('home_placeholder'),
  awayPlaceholder: text('away_placeholder'),
  // Fecha y sede
  kickoff: timestamp('kickoff', { withTimezone: true }),
  venue: text('venue'),
  // Resultado
  played: boolean('played').notNull().default(false),
  homeGoals: integer('home_goals'),
  awayGoals: integer('away_goals'),
  homeGoalsAfterExtra: integer('home_goals_after_extra'), // si hubo prórroga
  awayGoalsAfterExtra: integer('away_goals_after_extra'),
  homePenalties: integer('home_penalties'), // si hubo tanda
  awayPenalties: integer('away_penalties'),
  winMode: matchWinModeEnum('win_mode'),
  // Ganador del partido. Para fase de grupos puede ser null (empate).
  winnerTeamId: integer('winner_team_id').references(() => teams.id),
});

// ─── PORRAS ───────────────────────────────────────────────────────────────────

export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  participantName: text('participant_name').notNull(), // nombre persona
  teamName: text('team_name').notNull(), // nombre del equipo de la porra
  editToken: text('edit_token').notNull(), // token para editar antes del bloqueo
  goldenBootPlayerId: integer('golden_boot_player_id')
    .notNull()
    .references(() => players.id),
  totalSpent: integer('total_spent').notNull(), // millones gastados
  // Puntuación cacheada (se recalcula al actualizar resultados)
  points: doublePrecision('points').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Selecciones elegidas en cada porra (5 por porra)
export const entryTeams = pgTable(
  'entry_teams',
  {
    entryId: integer('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.entryId, t.teamId] }),
  }),
);

// ─── CONFIG GLOBAL ────────────────────────────────────────────────────────────

export const config = pgTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
  entryTeams: many(entryTeams),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
  entries: many(entries),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: 'home_team',
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: 'away_team',
  }),
  winner: one(teams, {
    fields: [matches.winnerTeamId],
    references: [teams.id],
    relationName: 'winner_team',
  }),
}));

export const entriesRelations = relations(entries, ({ one, many }) => ({
  goldenBootPlayer: one(players, {
    fields: [entries.goldenBootPlayerId],
    references: [players.id],
  }),
  entryTeams: many(entryTeams),
}));

export const entryTeamsRelations = relations(entryTeams, ({ one }) => ({
  entry: one(entries, { fields: [entryTeams.entryId], references: [entries.id] }),
  team: one(teams, { fields: [entryTeams.teamId], references: [teams.id] }),
}));

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type EntryTeam = typeof entryTeams.$inferSelect;

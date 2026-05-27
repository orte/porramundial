# Porra Mundial 2026 — Contexto del proyecto

## Resumen

Web app para hacer la porra del Mundial 2026 entre amigos. Cada participante
elige 5 selecciones (con 100M€ de presupuesto) y un candidato a Bota de Oro.
Los puntos se calculan según resultados de partidos, posiciones de grupo,
eliminatorias y goles del jugador elegido.

## Stack

- **Next.js 15** (App Router) con TypeScript estricto
- **PostgreSQL** en Neon (serverless)
- **Drizzle ORM** (no Prisma)
- **Tailwind CSS** (no shadcn/ui)
- **Deploy en Vercel**
- **Sin auth de usuario**: las porras se identifican con un `editToken` aleatorio
  guardado en cookie + en URL. Solo el admin tiene contraseña.

## Filosofía técnica

- **Simplicidad antes que sobreingeniería.** Este proyecto es para una porra
  entre amigos, no para escalar a millones. Si una solución requiere una
  librería extra para una mejora marginal, no se añade.
- **Server actions** sobre route handlers cuando sea posible.
- **Server components** por defecto; solo `'use client'` cuando hay interactividad.
- **Validación en servidor siempre**, aunque también haya validación en cliente
  (defensa en profundidad).
- **Defaults razonables** para que el usuario no tenga que configurar nada.

## Estilo y diseño

- **Estética deportiva clásica**: paleta verde césped oscuro + dorado trofeo.
- **Tipografía**: Bebas Neue (display) + Source Sans 3 (cuerpo) + JetBrains Mono
  (acentos numéricos).
- **Cards estilo Panini** con `border-trophy-700/40`, esquinas rectas (rounded-sm).
- **Sin emojis decorativos** en UI (excepto banderas, que sí son funcionales).
- **Textos en español de España**, tono natural y cercano pero no infantil.

## Estructura de carpetas

```
src/
├── app/
│   ├── actions/          # Server actions (entry.ts, admin.ts)
│   ├── admin/            # Panel admin (protegido por middleware)
│   ├── porra/[id]/       # Vista de una porra
│   ├── nueva-porra/      # Wizard de creación
│   ├── clasificacion/    # Ranking público
│   ├── partidos/         # (placeholder Fase 4)
│   ├── grupos/           # (placeholder Fase 4)
│   ├── goleadores/       # (placeholder Fase 4)
│   ├── layout.tsx
│   ├── page.tsx          # Home
│   └── globals.css       # Tema deportivo
├── components/           # Componentes compartidos
├── db/
│   ├── schema.ts         # Schema completo de Drizzle
│   ├── index.ts          # Conexión a Neon
│   ├── seed-teams.ts     # 48 selecciones + precios
│   ├── seed-players.ts   # 20 candidatos a Bota de Oro + "Otro"
│   ├── seed-matches.ts   # 104 partidos del Mundial
│   └── seed.ts           # Script que ejecuta todos los seeds
├── lib/
│   ├── cn.ts             # Utilidad clsx + tailwind-merge
│   ├── constants.ts      # BUDGET, MAX_TEAMS_BUDGET, MIN_GOLDEN_BOOT_COST, etc.
│   ├── lock.ts           # Lógica de bloqueo de porras
│   ├── token.ts          # Generación de editToken aleatorio
│   ├── queries.ts        # Lecturas para el wizard
│   └── queries-entry.ts  # Lecturas para la vista de porra
└── middleware.ts         # (lo creas en Fase 3)
```

## Modelo de datos (Drizzle, `src/db/schema.ts`)

- **teams** (id, name, code, flag, price, groupCode, groupPosition, eliminated)
- **players** (id, name, teamId, price, isCustom, goals, isGoldenBoot)
- **matches** (id, matchNumber 1-104, stage, groupCode, homeTeamId, awayTeamId,
  homePlaceholder, awayPlaceholder, kickoff, venue, played, homeGoals, awayGoals,
  homeGoalsAfterExtra, awayGoalsAfterExtra, homePenalties, awayPenalties,
  winMode, winnerTeamId)
- **entries** (id, participantName, teamName, editToken, goldenBootPlayerId,
  totalSpent, points, createdAt, updatedAt)
- **entry_teams** (entryId, teamId) — pivote N:M
- **config** (key, value) — para `lock_date` y otros ajustes globales

### Enums

- `stage`: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' |
  'semi_final' | 'third_place' | 'final'
- `match_win_mode`: 'regulation' | 'extra_time' | 'penalties' | 'draw'

## Reglas de negocio (CRÍTICAS)

### Presupuesto
- **Total**: 100M€ por porra.
- **Máximo en equipos**: 99M€ (se reservan 1M€ para el candidato a Bota de Oro,
  porque la opción "Otro" cuesta 1M€). Constante en `src/lib/constants.ts`.
- Pueden elegirse selecciones repetidas entre porras (dos amigos pueden tener
  ambos a España). Dentro de una misma porra, no se puede repetir.

### Puntuación

| Acción | Puntos |
|---|---|
| Partido ganado en los 90' | +2 |
| Partido empatado (fase de grupos) | +1 |
| 1º de grupo | +1 |
| 2º de grupo | +0.5 |
| Avanzar en una eliminatoria | +2 |
| Ganar el partido del 3er puesto | +1 |
| Ganar el Mundial | +4 |
| Por cada gol del candidato a Bota de Oro | +3 |
| Si el candidato es la Bota de Oro | +4 |

**Importante:** una victoria en eliminatoria en los 90' suma **2 (victoria) + 2
(avanzar) = 4 puntos**. Si la victoria es en prórroga o penaltis, solo suma
los 2 puntos por avanzar (no se considera "partido ganado en los 90'").

### Bloqueo
- Las porras se bloquean a partir de `LOCK_DATE` (por defecto, inicio del
  primer partido del Mundial).
- Después del bloqueo, no se pueden crear ni editar porras. Sí se puede ver todo.
- El admin puede cambiar la fecha de bloqueo desde el panel.

### Edición de porras
- Cada porra tiene un `editToken` único.
- El dueño puede editar mientras no esté bloqueada, identificándose por la
  cookie `porra_token_{id}` o por el query param `?token=xxx` en la URL.

## Convenciones de código

- **TypeScript estricto**, sin `any` salvo casos justificados.
- **Imports relativos con `@/`** (configurado en `tsconfig.json`).
- **Server actions** marcadas con `'use server';` al inicio del fichero.
- **Componentes cliente** con `'use client';` cuando usan estado o efectos.
- **Errores** se devuelven como `{ ok: false, error: string }` o se lanzan si
  son inesperados. Nunca strings sueltos.
- **Revalidación**: tras cualquier mutación, llamar `revalidatePath()` en las
  rutas afectadas.
- **Fechas en DB**: siempre `timestamp with timezone` (UTC). En UI, formatear
  con `Intl.DateTimeFormat` en `Europe/Madrid`.
- **Nombres de variables**: en español si son conceptos de negocio (porra,
  equipo, goleador), en inglés si son técnicos (entryId, isLocked).

## Comandos

```bash
npm run dev          # arrancar dev server
npm run build        # build de producción
npm run db:push      # aplicar cambios de schema a Neon
npm run db:seed      # poblar la DB con teams/players/matches
npm run db:studio    # abrir Drizzle Studio (visualizador de DB)
```

## Variables de entorno (`.env`)

- `DATABASE_URL` — connection string de Neon
- `ADMIN_PASSWORD` — contraseña del panel admin
- `ADMIN_SESSION_SECRET` — clave para firmar la cookie admin (32+ chars)
- `LOCK_DATE` — fecha ISO de bloqueo de porras (opcional; por defecto
  2026-06-11T17:00:00Z)

## Estado de las fases

- ✅ **Fase 1**: Estructura, schema, seeds, página de inicio.
- ✅ **Fase 2**: Wizard de creación, edición, vista de porra, clasificación
  básica. Incluye reserva de 1M€ para goleador.
- 🚧 **Fase 3**: Panel admin.
- 🚧 **Fase 4**: Vistas públicas detalladas.

## Cosas que NO hay que hacer

- No añadir librerías de UI (shadcn, Material, Chakra). El diseño está construido
  a mano con Tailwind, y la consistencia importa.
- No usar Prisma. El proyecto usa Drizzle.
- No añadir auth de usuarios (Clerk, NextAuth). Solo el admin tiene login.
- No añadir Sentry, analytics, ni servicios externos.
- No tocar el seed sin avisar primero — los datos están calibrados (precios
  basados en cuotas reales de casas de apuestas, calendario oficial FIFA).
- No cambiar el sistema de puntos sin avisar primero — está acordado con el
  cliente.
- No usar `any` ni `// @ts-ignore` salvo justificación explícita.

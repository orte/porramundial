# Porra Mundial 2026

Web app para hacer la porra del Mundial 2026 entre amigos. Cada participante elige
5 selecciones (con 100M€ de presupuesto) y un candidato a Bota de Oro.

## Stack

- **Frontend + Backend:** Next.js 15 (App Router) en Vercel
- **DB:** PostgreSQL en Neon
- **ORM:** Drizzle
- **Estilos:** Tailwind CSS
- **Auth admin:** cookie + variable de entorno (sin Clerk)

## Estructura

```
src/
├── app/                  # Páginas de Next.js (App Router)
│   ├── layout.tsx        # Layout global + fuentes
│   ├── page.tsx          # Página de inicio
│   └── globals.css       # Estilos globales (tema deportivo clásico)
├── db/
│   ├── schema.ts         # Schema de Drizzle (tablas, enums, relations)
│   ├── index.ts          # Conexión a Neon
│   ├── seed-teams.ts     # Las 48 selecciones con precios y grupos
│   ├── seed-players.ts   # Los 20 candidatos a Bota de Oro
│   ├── seed-matches.ts   # Calendario completo (104 partidos)
│   └── seed.ts           # Script que ejecuta todos los seeds
├── lib/
│   └── cn.ts             # Utilidad para combinar clases
└── components/           # (se rellenará en fases siguientes)
```

## Setup en local

### 1. Instalar dependencias

```bash
pnpm install
# o npm install / yarn / bun
```

### 2. Crear la base de datos en Neon

1. Ve a [neon.tech](https://neon.tech), crea un proyecto.
2. Copia la **connection string** (la versión "pooled" o no, ambas valen).

### 3. Configurar variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` y rellena:

- `DATABASE_URL`: la connection string de Neon
- `ADMIN_PASSWORD`: la contraseña del panel admin (la pones tú)
- `ADMIN_SESSION_SECRET`: un string aleatorio largo, ej. `openssl rand -hex 32`
- `LOCK_DATE`: fecha en la que se bloquean las porras. Por defecto: inicio del Mundial.

### 4. Crear tablas y poblar datos

```bash
pnpm db:push   # crea las tablas a partir del schema
pnpm db:seed   # mete los 48 equipos, 21 jugadores y 104 partidos
```

### 5. Arrancar en local

```bash
pnpm dev
```

Abre http://localhost:3000

## Despliegue en Vercel

1. Sube el repo a GitHub.
2. En Vercel: "New Project" → importar el repo.
3. En **Environment Variables**, pega las mismas que tengas en `.env` (salvo
   `LOCK_DATE` si quieres usar el default).
4. Deploy.
5. Una vez desplegado, ejecuta el seed **una vez** desde local apuntando a la
   misma `DATABASE_URL` de Neon que usa Vercel.

## Modelo de datos

- **teams** — las 48 selecciones, con su precio en M€ y código de grupo.
- **players** — los 21 candidatos a Bota de Oro (20 reales + "Otro" como
  plantilla para que el usuario pueda crear un jugador custom).
- **matches** — los 104 partidos. En eliminatorias, los equipos son `null`
  inicialmente y se rellenan cuando se conocen los cruces.
- **entries** — cada porra que crea un participante (nombre, equipo, presupuesto
  gastado, puntuación cacheada).
- **entry_teams** — las 5 selecciones elegidas por cada porra (tabla pivote).
- **config** — clave/valor para configuración global (ej. `lock_date`).

## Reglas de puntuación

| Acción | Puntos |
|---|---|
| Partido ganado en los 90 min | +2 |
| Partido empatado (fase de grupos) | +1 |
| Tu selección queda 1ª de grupo | +1 |
| Tu selección queda 2ª de grupo | +0,5 |
| Avanzar en una eliminatoria | +2 |
| Ganar el partido por el 3er puesto | +1 |
| Ganar el Mundial | +4 |
| Por cada gol de tu candidato a Bota de Oro | +3 |
| Si tu candidato es la Bota de Oro | +4 |

**Nota sobre eliminatorias:** si tu selección gana un partido de eliminatoria en
los 90 minutos, suma 2 (victoria) + 2 (avanzar) = 4 puntos. Si lo gana en
prórroga o penaltis, solo suma los 2 puntos por avanzar.

## Roadmap

- ✅ **Fase 1**: Estructura, base de datos, seeds, página de inicio.
- ✅ **Fase 2**: Flujo de crear porra (wizard de 3 pasos: datos, selecciones, goleador). Edición previa al bloqueo.
- 🚧 **Fase 3**: Panel admin (login, meter resultados, marcar posiciones de grupo, cálculo de puntos).
- 🚧 **Fase 4**: Vistas públicas (clasificación, partidos, grupos, goleadores) + sidebar con partidos del día.

## Rutas disponibles

| Ruta | Qué hace |
|---|---|
| `/` | Página de inicio con explicación de las reglas y botón "Nueva porra" |
| `/nueva-porra` | Wizard de 3 pasos para crear una porra |
| `/porra/[id]` | Ver porra creada (con opción de editar si tienes el token) |
| `/porra/[id]?edit=1` | Editar porra (requiere token de propietario) |
| `/clasificacion` | Ranking de todas las porras |
| `/partidos`, `/grupos`, `/goleadores` | (placeholder Fase 4) |
| `/admin` | (placeholder Fase 3) |

## Cómo se identifica al dueño de una porra

Sin login. Al crear una porra se genera un `editToken` aleatorio que:

1. Se guarda en la DB junto a la porra.
2. Se guarda en una cookie del navegador (`porra_token_{id}`) durante 60 días.
3. Si el participante quiere editar desde otro dispositivo, puede pasar el
   token en la URL como `?token=xxx`.

El admin (Fase 3) podrá ver todos los tokens si fuera necesario.

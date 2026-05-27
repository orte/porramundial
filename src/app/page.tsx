import Link from 'next/link';
import { db } from '@/db';
import { teams, entries, matches } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { isLocked } from '@/lib/lock';
import { getStandings, getRecentResults, type StandingRow } from '@/lib/queries-public';
import type { AdminMatch } from '@/lib/queries-admin';
import { formatPoints } from '@/lib/format';
import { cn } from '@/lib/cn';

// Indicamos a Next.js que esta página se renderiza dinámicamente
// porque consulta la DB
export const dynamic = 'force-dynamic';

async function getHomeStats() {
  // Tres consultas en paralelo
  const [teamsCount, entriesCount, matchesCount] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(teams),
    db.select({ c: sql<number>`count(*)::int` }).from(entries),
    db.select({ c: sql<number>`count(*)::int` }).from(matches),
  ]);

  return {
    teams: teamsCount[0]?.c ?? 0,
    entries: entriesCount[0]?.c ?? 0,
    matches: matchesCount[0]?.c ?? 0,
  };
}

type HomeProps = {
  searchParams: Promise<{ locked?: string }>;
};

export default async function HomePage({ searchParams }: HomeProps) {
  let stats = { teams: 0, entries: 0, matches: 0 };
  let locked = false;
  let leader: StandingRow | null = null;
  let recent: AdminMatch[] = [];

  // Si la DB aún no está poblada, evitamos romper la página
  try {
    const [s, l, standings, recientes] = await Promise.all([
      getHomeStats(),
      isLocked(),
      getStandings(),
      getRecentResults(3),
    ]);
    stats = s;
    locked = l;
    leader = standings[0] ?? null;
    recent = recientes;
  } catch (err) {
    console.error('Error cargando stats:', err);
  }

  const sp = await searchParams;
  const showLockedMsg = sp.locked === '1' || locked;

  return (
    <main className="relative z-10 min-h-screen">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <header className="border-b border-pitch-800/50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyMark />
            <div>
              <p className="font-display text-trophy-300 text-sm leading-none tracking-widest">
                La Porra
              </p>
              <p className="font-display text-trophy-50 text-lg leading-none tracking-wider">
                Mundial 2026
              </p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1 text-sm font-display uppercase tracking-wider">
            <Link
              href="/clasificacion"
              className="px-3 py-1.5 text-pitch-200 hover:text-trophy-300 transition-colors"
            >
              Sailkapena
            </Link>
            <Link
              href="/partidos"
              className="px-3 py-1.5 text-pitch-200 hover:text-trophy-300 transition-colors"
            >
              Partidak
            </Link>
            <Link
              href="/grupos"
              className="px-3 py-1.5 text-pitch-200 hover:text-trophy-300 transition-colors"
            >
              Multzoak
            </Link>
            <Link
              href="/goleadores"
              className="px-3 py-1.5 text-pitch-200 hover:text-trophy-300 transition-colors"
            >
              Golegileak
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="tag-accent">USA · CAN · MEX</span>
              <span className="tag">eka. 11 → uzt. 19</span>
              <span className="tag">48 selekzio</span>
            </div>

            <h1 className="font-display text-trophy-50 leading-[0.9] text-6xl sm:text-7xl md:text-8xl">
              Altxa
              <br />
              <span className="text-trophy-300">garaikurra</span>
              <br />
              lagunekin.
            </h1>

            <p className="mt-8 text-pitch-100 text-lg max-w-xl leading-relaxed">
              <span className="text-trophy-300 font-semibold">100 milioi</span> dituzu{' '}
              <span className="text-trophy-300 font-semibold">5 selekzio</span> eta{' '}
              <span className="text-trophy-300 font-semibold">Urrezko Bota hautagai bat</span>{' '}
              fitxatzeko. Puntuak irabaziko dituzu garaipen, gol eta gainditutako kanporaketa
              bakoitzeko. Mundialaren amaieran gehien batzen duenak jasoko du porra.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {locked ? (
                <span className="btn-ghost cursor-not-allowed opacity-70">
                  🔒 Porrak blokeatuta
                </span>
              ) : (
                <Link href="/nueva-porra" className="btn-primary">
                  Porra berria
                  <ArrowRight />
                </Link>
              )}
              <Link href="/clasificacion" className="btn-ghost">
                Ikusi sailkapena
              </Link>
            </div>

            {showLockedMsg && (
              <p className="mt-4 text-sm text-trophy-300 font-mono">
                Mundiala hasi da: porrak itxita daude. Sailkapena zuzenean jarrai dezakezu.
              </p>
            )}
          </div>

          <BadgePoster />
        </div>
      </section>

      {/* ─── DIVIDER ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="ribbon-divider" />
      </div>

      {/* ─── STATS / EN VIVO ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {(leader || recent.length > 0) && (
          <div
            className={cn(
              'grid gap-6 mb-8',
              leader && recent.length > 0 ? 'lg:grid-cols-2' : 'grid-cols-1',
            )}
          >
            {leader && <LeaderMini leader={leader} />}
            {recent.length > 0 && <RecentResults matches={recent} />}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Selekzioak" value={stats.teams} suffix="/ 48" />
          <StatCard label="Partidak" value={stats.matches} suffix="/ 104" />
          <StatCard label="Porrak" value={stats.entries} suffix="" />
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl text-trophy-100 mb-2">
          Nola jokatzen den
        </h2>
        <p className="text-pitch-200 mb-10 max-w-2xl">
          Hiru urrats, aukera bakarra. Porrak Mundialeko lehen partida hasten denean
          blokeatzen dira.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <StepCard
            number="01"
            title="Fitxatu 5 selekzio"
            description="100M€ko aurrekontuarekin. Espainia eta Frantzia dira garestienak (45M€). Faborito gutxien direnak, 2M€tik aurrera."
          />
          <StepCard
            number="02"
            title="Aukeratu zure Urrezko Bota"
            description="20 hautagai, 10M€ eta 2M€ arteko prezioekin. Usteren bat duzu? «Beste bat» aukera dago 1M€an."
          />
          <StepCard
            number="03"
            title="Batu puntuak egunero"
            description="Garaipenak, golak, multzoko lehen postua, kanporaketak, Urrezko Bota… Dena zenbatzen da."
          />
        </div>
      </section>

      {/* ─── SCORING ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="panini-card-accent p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-trophy-400 font-display text-xs tracking-widest">
              Araudia
            </span>
            <div className="flex-1 h-px bg-trophy-700/40" />
          </div>

          <h2 className="font-display text-3xl text-trophy-100 mb-8">
            Nola batzen diren puntuak
          </h2>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-3 text-pitch-100">
            <ScoringLine pts="+2" text="90 minutuetan irabazitako partida" />
            <ScoringLine pts="+1" text="Multzo-fasean berdindutako partida" />
            <ScoringLine pts="+1" text="Zure selekzioa multzoko 1. geratzea" />
            <ScoringLine pts="+0,5" text="Zure selekzioa multzoko 2. geratzea" />
            <ScoringLine pts="+2" text="Kanporaketa batean aurrera egitea" />
            <ScoringLine pts="+1" text="Hirugarren postuko partida irabaztea" />
            <ScoringLine pts="+4" text="Mundiala irabaztea" />
            <ScoringLine pts="+3" text="Zure Urrezko Bota hautagaiaren gol bakoitzeko" />
            <ScoringLine pts="+4" text="Zure hautagaia Urrezko Bota bada" />
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-pitch-800/50 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-pitch-300">
          <p className="font-mono">© 2026 · Lagun arteko porra</p>
          <p className="font-mono text-trophy-700">
            <Link href="/admin" className="hover:text-trophy-400">
              admin
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

// ─── COMPONENTES INTERNOS ───────────────────────────────────────────

function TrophyMark() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 4h16v6c0 4.4-3.6 8-8 8s-8-3.6-8-8V4z"
        stroke="#d8932f"
        strokeWidth="1.5"
        fill="#173817"
      />
      <path
        d="M8 7C5.5 7 4 8.5 4 11s1.5 4 4 4M24 7c2.5 0 4 1.5 4 4s-1.5 4-4 4"
        stroke="#d8932f"
        strokeWidth="1.5"
      />
      <path d="M12 18v4h8v-4" stroke="#d8932f" strokeWidth="1.5" />
      <path d="M10 26h12" stroke="#d8932f" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 22v4M18 22v4" stroke="#d8932f" strokeWidth="1.5" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 8h12m0 0L9 3m5 5l-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

function BadgePoster() {
  // Cartel tipo escudo con la "marca" del torneo: una pieza decorativa
  return (
    <div className="relative aspect-[3/4] max-w-sm mx-auto w-full">
      <div className="absolute inset-0 panini-card-accent p-1">
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
          {/* Patrón decorativo */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(216,147,47,0.2) 12px, rgba(216,147,47,0.2) 14px)',
            }}
          />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 mb-5 rounded-full border-2 border-trophy-400 flex items-center justify-center">
              <TrophyMark />
            </div>
            <p className="font-display text-trophy-200 text-xs tracking-[0.3em] mb-1">
              FIFA WORLD CUP
            </p>
            <p className="font-display text-trophy-50 text-5xl tracking-tight leading-none">
              2026
            </p>
            <div className="my-6 w-12 h-px bg-trophy-400" />
            <p className="font-display text-trophy-300 text-xs tracking-[0.3em]">
              UNITED · 2026
            </p>
            <div className="mt-8 flex items-center gap-2 text-2xl">
              <span>🇺🇸</span>
              <span>🇨🇦</span>
              <span>🇲🇽</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="panini-card p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-pitch-300 mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-4xl text-trophy-100">{value}</span>
        {suffix && (
          <span className="font-display text-trophy-700 text-sm tracking-wider">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="panini-card p-6 relative">
      <p className="font-display text-trophy-700 text-5xl absolute top-3 right-4">
        {number}
      </p>
      <h3 className="font-display text-trophy-200 text-xl mb-3 relative z-10">
        {title}
      </h3>
      <p className="text-pitch-200 leading-relaxed text-sm relative z-10">
        {description}
      </p>
    </div>
  );
}

function ScoringLine({ pts, text }: { pts: string; text: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="font-display text-trophy-300 text-lg min-w-[2.5rem]">
        {pts}
      </span>
      <span className="text-pitch-100 text-sm">{text}</span>
    </div>
  );
}

function LeaderMini({ leader }: { leader: StandingRow }) {
  return (
    <Link
      href={`/porra/${leader.id}`}
      className="panini-card-accent p-6 flex items-center gap-4 group"
    >
      <div className="w-12 h-12 rounded-full border-2 border-trophy-400 flex items-center justify-center shrink-0">
        <TrophyMark />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs uppercase tracking-widest text-trophy-300">Uneko liderra</p>
        <p className="font-display text-trophy-50 text-2xl leading-none truncate group-hover:text-trophy-200 transition-colors">
          {leader.teamName}
        </p>
        <p className="text-pitch-200 text-sm mt-0.5">{leader.participantName}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-display text-trophy-100 text-4xl leading-none tabular-nums">
          {formatPoints(leader.points)}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-trophy-700 mt-1">pts</p>
      </div>
    </Link>
  );
}

function RecentResults({ matches }: { matches: AdminMatch[] }) {
  return (
    <div className="panini-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
          Azken emaitzak
        </h2>
        <div className="flex-1 h-px bg-pitch-800" />
        <Link
          href="/partidos?filter=jugados"
          className="font-display text-pitch-300 hover:text-trophy-300 text-xs tracking-widest transition-colors"
        >
          Ikusi denak →
        </Link>
      </div>
      <div className="space-y-3">
        {matches.map((m) => (
          <RecentRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function RecentRow({ match }: { match: AdminMatch }) {
  const aetpen = match.winMode === 'extra_time' || match.winMode === 'penalties';
  const home = (aetpen ? match.homeGoalsAfterExtra : match.homeGoals) ?? 0;
  const away = (aetpen ? match.awayGoalsAfterExtra : match.awayGoals) ?? 0;
  const badge =
    match.winMode === 'extra_time' ? 'AET' : match.winMode === 'penalties' ? 'PEN' : null;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
      <span className="flex items-center justify-end gap-2 text-right min-w-0">
        <span
          className={cn(
            'font-display truncate',
            match.winnerTeamId === match.home?.id ? 'text-trophy-100' : 'text-pitch-100',
          )}
        >
          {match.home?.name ?? match.homePlaceholder ?? '¿?'}
        </span>
        <span className="shrink-0" aria-hidden>
          {match.home?.flag ?? '⚽'}
        </span>
      </span>
      <span className="flex flex-col items-center px-1">
        <span className="font-display text-trophy-100 tabular-nums">
          {home}<span className="text-pitch-500 mx-0.5">·</span>{away}
        </span>
        {badge && <span className="tag text-[8px] px-1 py-0 mt-0.5">{badge}</span>}
      </span>
      <span className="flex items-center gap-2 min-w-0">
        <span className="shrink-0" aria-hidden>
          {match.away?.flag ?? '⚽'}
        </span>
        <span
          className={cn(
            'font-display truncate',
            match.winnerTeamId === match.away?.id ? 'text-trophy-100' : 'text-pitch-100',
          )}
        >
          {match.away?.name ?? match.awayPlaceholder ?? '¿?'}
        </span>
      </span>
    </div>
  );
}

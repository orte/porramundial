import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import { getAllAdminMatches, type AdminMatch } from '@/lib/queries-admin';
import { formatDayHeading, formatTime, madridDayKey } from '@/lib/dates';
import { stageLabelEu } from '@/lib/stages';
import type { Match } from '@/db/schema';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Partidak · Porra Mundial 2026' };

type Stage = Match['stage'];

const UPCOMING_DAYS = 7;
const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h

const PRIMARY_FILTERS = [
  { key: 'proximos', label: 'Hurrengoak' },
  { key: 'hoy', label: 'Gaur' },
  { key: 'jugados', label: 'Jokatuak' },
  { key: 'todos', label: 'Denak' },
] as const;
type PrimaryFilter = (typeof PRIMARY_FILTERS)[number]['key'];

const FASE_CHIPS: { stage: Stage; label: string }[] = [
  { stage: 'group', label: 'Multzoak' },
  { stage: 'round_of_32', label: '16renak' },
  { stage: 'round_of_16', label: '8renak' },
  { stage: 'quarter_final', label: 'Laurdenak' },
  { stage: 'semi_final', label: 'Finalerdiak' },
  { stage: 'third_place', label: '3. postua' },
  { stage: 'final', label: 'Finala' },
];
const VALID_STAGES = new Set<string>(FASE_CHIPS.map((f) => f.stage));

export default async function PartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; fase?: string }>;
}) {
  const sp = await searchParams;
  const fase = sp.fase && VALID_STAGES.has(sp.fase) ? (sp.fase as Stage) : null;
  const filter: PrimaryFilter = fase
    ? 'todos'
    : ((PRIMARY_FILTERS.find((f) => f.key === sp.filter)?.key ?? 'proximos') as PrimaryFilter);

  const all = await getAllAdminMatches();
  const now = new Date();
  const todayKey = madridDayKey(now);
  const windowKeys = new Set<string>();
  for (let i = 0; i < UPCOMING_DAYS; i++) {
    windowKeys.add(madridDayKey(new Date(now.getTime() + i * 86_400_000)));
  }

  // Selección + orden según el filtro activo.
  let selected: AdminMatch[];
  let descending = false;
  if (fase) {
    selected = all.filter((m) => m.stage === fase);
  } else if (filter === 'hoy') {
    selected = all.filter((m) => m.kickoff != null && madridDayKey(m.kickoff) === todayKey);
  } else if (filter === 'jugados') {
    selected = all.filter((m) => m.played);
    descending = true;
  } else if (filter === 'proximos') {
    selected = all.filter(
      (m) => !m.played && m.kickoff != null && windowKeys.has(madridDayKey(m.kickoff)),
    );
  } else {
    selected = all;
  }

  const days = groupByDay(selected, descending);

  return (
    <main className="relative z-10 min-h-screen">
      <PublicHeader active="partidos" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="font-display text-trophy-50 text-5xl sm:text-6xl">Partidak</h1>
          <p className="text-pitch-200 mt-2">
            Mundial 2026ko egutegi osoa. Ordutegiak Espainiako penintsulako orduan.
          </p>
        </div>

        {/* Filtros principales */}
        <div className="flex flex-wrap gap-2 mb-3">
          {PRIMARY_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              href={f.key === 'proximos' ? '/partidos' : `/partidos?filter=${f.key}`}
              label={f.label}
              active={!fase && filter === f.key}
            />
          ))}
        </div>

        {/* Filtro por fase */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="font-mono text-[11px] uppercase tracking-wider text-pitch-400 mr-1">
            Faseka
          </span>
          {FASE_CHIPS.map((f) => (
            <FilterChip
              key={f.stage}
              href={`/partidos?fase=${f.stage}`}
              label={f.label}
              active={fase === f.stage}
              small
            />
          ))}
        </div>

        {selected.length === 0 ? (
          <div className="panini-card p-8 text-center text-pitch-300 text-sm">
            {emptyMessage(fase, filter)}
          </div>
        ) : (
          <div className="space-y-8">
            {days.map(({ key, matches }) => (
              <section key={key}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
                    {matches[0].kickoff ? formatDayHeading(matches[0].kickoff, 'eu') : 'Datarik gabe'}
                  </h2>
                  <div className="flex-1 h-px bg-pitch-800" />
                </div>
                <div className="space-y-3">
                  {matches.map((m) => (
                    <MatchCard key={m.id} match={m} now={now} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── COMPONENTES ─────────────────────────────────────────────────────────────

function FilterChip({
  href,
  label,
  active,
  small,
}: {
  href: string;
  label: string;
  active: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-sm font-display uppercase tracking-wider border transition-colors',
        small ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
        active
          ? 'border-trophy-400 bg-trophy-950/40 text-trophy-100'
          : 'border-pitch-700 text-pitch-300 hover:border-pitch-500 hover:text-pitch-100',
      )}
    >
      {label}
    </Link>
  );
}

function MatchCard({ match, now }: { match: AdminMatch; now: Date }) {
  const live =
    !match.played &&
    match.kickoff != null &&
    match.kickoff.getTime() <= now.getTime() &&
    now.getTime() - match.kickoff.getTime() < LIVE_WINDOW_MS;

  const tag =
    match.stage === 'group' && match.groupCode
      ? `${match.groupCode} multzoa`
      : stageLabelEu(match.stage);

  return (
    <article className="panini-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-pitch-400">#{match.matchNumber}</span>
          <span className="tag text-[10px]">{tag}</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {live && (
            <span className="tag-accent text-[10px] animate-pulse" aria-label="Partida jokoan">
              ● Jokoan
            </span>
          )}
          <span className="font-mono text-xs text-pitch-300">
            {match.kickoff ? formatTime(match.kickoff, 'eu') : '—'}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamBlock
          name={match.home?.name ?? match.homePlaceholder ?? '¿?'}
          flag={match.home?.flag ?? null}
          align="right"
          winner={match.winnerTeamId != null && match.winnerTeamId === match.home?.id}
        />
        <Score match={match} />
        <TeamBlock
          name={match.away?.name ?? match.awayPlaceholder ?? '¿?'}
          flag={match.away?.flag ?? null}
          align="left"
          winner={match.winnerTeamId != null && match.winnerTeamId === match.away?.id}
        />
      </div>

      {match.venue && (
        <p className="mt-3 text-center font-mono text-[11px] text-pitch-400">{match.venue}</p>
      )}
    </article>
  );
}

function TeamBlock({
  name,
  flag,
  align,
  winner,
}: {
  name: string;
  flag: string | null;
  align: 'left' | 'right';
  winner: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 min-w-0',
        align === 'right' ? 'justify-end text-right flex-row-reverse' : 'justify-start text-left',
      )}
    >
      <span className="text-2xl shrink-0" aria-hidden>
        {flag ?? '⚽'}
      </span>
      <span
        className={cn(
          'font-display leading-tight truncate',
          winner ? 'text-trophy-100' : 'text-pitch-50',
        )}
      >
        {name}
      </span>
    </div>
  );
}

function Score({ match }: { match: AdminMatch }) {
  if (!match.played) {
    return <span className="font-display text-pitch-500 text-2xl px-2">–</span>;
  }

  const aet = match.winMode === 'extra_time';
  const pen = match.winMode === 'penalties';
  // En prórroga/penaltis mostramos el marcador tras los 120'; en penaltis,
  // además, la tanda en pequeño.
  const home = aet || pen ? match.homeGoalsAfterExtra : match.homeGoals;
  const away = aet || pen ? match.awayGoalsAfterExtra : match.awayGoals;

  return (
    <div className="flex flex-col items-center px-1">
      <span className="font-display text-trophy-100 text-3xl leading-none tabular-nums">
        {home ?? 0}<span className="text-pitch-500 mx-1">·</span>{away ?? 0}
      </span>
      {(aet || pen) && (
        <span className="mt-1 flex items-center gap-1.5">
          <span className="tag text-[9px] px-1.5 py-0">{aet ? 'AET' : 'PEN'}</span>
          {pen && (
            <span className="font-mono text-[11px] text-pitch-300">
              {match.homePenalties ?? 0}–{match.awayPenalties ?? 0}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function groupByDay(
  matches: AdminMatch[],
  descending: boolean,
): { key: string; matches: AdminMatch[] }[] {
  const sorted = [...matches].sort((a, b) => {
    const ta = a.kickoff?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const tb = b.kickoff?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return descending ? tb - ta : ta - tb;
  });

  const order: string[] = [];
  const groups = new Map<string, AdminMatch[]>();
  for (const m of sorted) {
    const key = m.kickoff ? madridDayKey(m.kickoff) : 'sin-fecha';
    const arr = groups.get(key);
    if (arr) arr.push(m);
    else {
      groups.set(key, [m]);
      order.push(key);
    }
  }
  return order.map((key) => ({ key, matches: groups.get(key)! }));
}

function emptyMessage(fase: Stage | null, filter: PrimaryFilter): string {
  if (fase) return 'Ez dago partidarik fase honetan.';
  if (filter === 'hoy') return 'Gaur ez da partidarik jokatzen.';
  if (filter === 'jugados') return 'Oraindik ez da partidarik jokatu.';
  if (filter === 'proximos') return 'Ez dago partidarik hurrengo 7 egunetan.';
  return 'Ez dago partidarik.';
}

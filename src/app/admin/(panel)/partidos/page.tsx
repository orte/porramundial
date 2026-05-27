import Link from 'next/link';
import { getAllAdminMatches, type AdminMatch } from '@/lib/queries-admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { MatchResultForm } from '@/components/admin/MatchResultForm';
import { formatDayHeading, formatTime, madridDayKey } from '@/lib/dates';
import { stageLabel } from '@/lib/stages';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Partidos · Admin' };

type Filter = 'todos' | 'pendientes' | 'jugados' | 'sin-asignar';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'jugados', label: 'Jugados' },
  { key: 'sin-asignar', label: 'Sin asignar' },
];

function hasTeams(m: AdminMatch): boolean {
  return m.home != null && m.away != null;
}

function matchesFilter(m: AdminMatch, filter: Filter): boolean {
  switch (filter) {
    case 'jugados':
      return m.played;
    case 'pendientes':
      return !m.played && hasTeams(m);
    case 'sin-asignar':
      return !hasTeams(m);
    default:
      return true;
  }
}

export default async function AdminPartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter: Filter =
    FILTERS.find((f) => f.key === sp.filter)?.key ?? 'todos';

  const all = await getAllAdminMatches();
  const filtered = all.filter((m) => matchesFilter(m, filter));

  // Agrupar por día (horario Madrid). Los partidos sin kickoff caen al final.
  const groups = new Map<string, AdminMatch[]>();
  const noDate: AdminMatch[] = [];
  for (const m of filtered) {
    if (!m.kickoff) {
      noDate.push(m);
      continue;
    }
    const key = madridDayKey(m.kickoff);
    const arr = groups.get(key);
    if (arr) arr.push(m);
    else groups.set(key, [m]);
  }
  const orderedDays = [...groups.keys()].sort();

  return (
    <div className="px-5 sm:px-8 py-8 max-w-4xl">
      <PageHeader
        title="Partidos"
        description="Mete los resultados. Tras guardar, los puntos de todas las porras se recalculan automáticamente."
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'todos' ? '/admin/partidos' : `/admin/partidos?filter=${f.key}`}
            className={cn(
              'px-3 py-1.5 rounded-sm font-display uppercase tracking-wider text-xs border transition-colors',
              filter === f.key
                ? 'border-trophy-400 bg-trophy-950/40 text-trophy-100'
                : 'border-pitch-700 text-pitch-300 hover:border-pitch-500 hover:text-pitch-100',
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="panini-card p-8 text-center text-pitch-300 text-sm">
          No hay partidos en este filtro.
        </div>
      ) : (
        <div className="space-y-8">
          {orderedDays.map((day) => {
            const dayMatches = groups.get(day)!;
            return (
              <section key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
                    {formatDayHeading(dayMatches[0].kickoff!)}
                  </h2>
                  <div className="flex-1 h-px bg-pitch-800" />
                </div>
                <div className="space-y-3">
                  {dayMatches.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </section>
            );
          })}

          {noDate.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
                  Sin fecha
                </h2>
                <div className="flex-1 h-px bg-pitch-800" />
              </div>
              <div className="space-y-3">
                {noDate.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: AdminMatch }) {
  return (
    <div className="panini-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-pitch-400">#{match.matchNumber}</span>
          <span className="tag text-[10px]">
            {match.stage === 'group' && match.groupCode
              ? `Grupo ${match.groupCode}`
              : stageLabel(match.stage)}
          </span>
        </span>
        <span className="font-mono text-xs text-pitch-300">
          {match.kickoff ? formatTime(match.kickoff) : '—'}
          {match.venue ? ` · ${match.venue}` : ''}
        </span>
      </div>

      {match.home && match.away ? (
        <MatchResultForm match={match} />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-pitch-300 text-sm">
            {match.homePlaceholder ?? '¿?'}{' '}
            <span className="text-pitch-500">vs</span> {match.awayPlaceholder ?? '¿?'}
          </p>
          <Link href="/admin/eliminatorias" className="btn-ghost text-xs py-1.5 px-3">
            Asignar equipos
          </Link>
        </div>
      )}
    </div>
  );
}

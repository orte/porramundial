import Link from 'next/link';
import { getDashboardData } from '@/lib/queries-admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { RecalcButton } from '@/components/admin/RecalcButton';
import { formatShort } from '@/lib/dates';
import { stageLabel } from '@/lib/stages';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Panel · Admin' };

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="px-5 sm:px-8 py-8 max-w-5xl">
      <PageHeader title="Panel" description="Resumen del torneo y acceso rápido a la gestión.">
        <RecalcButton />
      </PageHeader>

      {/* Estado del bloqueo */}
      <div className="panini-card p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-pitch-300">
            Bloqueo de porras
          </p>
          <p className="font-display text-trophy-100 text-xl mt-1">
            {formatShort(data.lockDate)}
          </p>
        </div>
        <span
          className={
            data.isLocked
              ? 'tag-accent'
              : 'tag'
          }
        >
          {data.isLocked ? '🔒 Bloqueadas' : 'Abiertas'}
        </span>
        <Link href="/admin/config" className="btn-ghost text-sm">
          Cambiar fecha
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <Stat label="Jugados" value={data.matchesPlayed} suffix="/ 104" />
        <Stat label="Pendientes" value={data.matchesPending} />
        <Stat label="Sin asignar" value={data.matchesUnassigned} />
        <Stat label="Grupos cerrados" value={data.groupsClosed} suffix="/ 12" />
        <Stat label="Porras" value={data.entriesCount} />
      </div>

      {/* Próximos partidos */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
            Próximos partidos
          </h2>
          <div className="flex-1 h-px bg-pitch-800" />
          <Link
            href="/admin/partidos"
            className="font-display text-pitch-300 hover:text-trophy-300 text-xs tracking-widest transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {data.upcoming.length === 0 ? (
          <div className="panini-card p-6 text-center text-pitch-300 text-sm">
            No hay partidos próximos con equipos asignados.
          </div>
        ) : (
          <div className="panini-card divide-y divide-pitch-800">
            {data.upcoming.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-4 py-3">
                <span className="font-mono text-xs text-pitch-400 w-8 shrink-0">
                  #{m.matchNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-pitch-50 text-base leading-tight truncate">
                    {m.home?.flag} {m.home?.name}{' '}
                    <span className="text-pitch-400">vs</span> {m.away?.flag} {m.away?.name}
                  </p>
                  <p className="text-pitch-300 text-xs mt-0.5">
                    {stageLabel(m.stage)}
                    {m.venue ? ` · ${m.venue}` : ''}
                  </p>
                </div>
                <span className="font-mono text-xs text-trophy-300 shrink-0">
                  {m.kickoff ? formatShort(m.kickoff) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="panini-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-pitch-300 mb-1 leading-tight">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-3xl text-trophy-100">{value}</span>
        {suffix && <span className="font-display text-trophy-700 text-xs tracking-wider">{suffix}</span>}
      </div>
    </div>
  );
}

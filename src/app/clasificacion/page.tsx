import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import {
  getStandings,
  getTournamentStatus,
  type StandingRow,
  type TournamentStatus,
} from '@/lib/queries-public';
import { stageLabel } from '@/lib/stages';
import { formatPoints } from '@/lib/format';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clasificación · Porra Mundial 2026' };

export default async function ClasificacionPage() {
  const [rows, status] = await Promise.all([getStandings(), getTournamentStatus()]);
  const leader = rows[0] ?? null;

  return (
    <main className="relative z-10 min-h-screen">
      <PublicHeader active="clasificacion" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="font-display text-trophy-50 text-5xl sm:text-6xl">Clasificación</h1>
          <p className="text-pitch-200 mt-2">{statusLine(status)}</p>
        </div>

        {rows.length === 0 ? (
          <div className="panini-card p-10 text-center">
            <p className="font-display text-2xl text-trophy-200 mb-3">Aún no hay porras</p>
            <p className="text-pitch-300 mb-6">Sé el primero en participar y empieza la liguilla.</p>
            <Link href="/nueva-porra" className="btn-primary">
              Crear la primera porra
            </Link>
          </div>
        ) : (
          <>
            {leader && <LeaderCard leader={leader} />}

            <div className="panini-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-pitch-700 text-left">
                    <th className="font-mono text-xs uppercase tracking-widest text-pitch-300 px-4 py-3 w-12 text-center">
                      #
                    </th>
                    <th className="font-mono text-xs uppercase tracking-widest text-pitch-300 px-4 py-3">
                      Porra
                    </th>
                    <th className="font-mono text-xs uppercase tracking-widest text-pitch-300 px-4 py-3 hidden sm:table-cell">
                      Bota de oro
                    </th>
                    <th className="font-mono text-xs uppercase tracking-widest text-pitch-300 px-4 py-3 text-right">
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <StandingTr key={row.id} row={row} position={idx + 1} />
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-pitch-400 text-xs mt-4 font-mono">
              Empates a puntos se desempatan por menos presupuesto gastado.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function LeaderCard({ leader }: { leader: StandingRow }) {
  return (
    <div className="panini-card-accent p-6 mb-8 flex items-center gap-5">
      <div className="w-14 h-14 rounded-full border-2 border-trophy-400 flex items-center justify-center shrink-0">
        <TrophyMark />
      </div>
      <Link href={`/porra/${leader.id}`} className="flex-1 min-w-0 group">
        <p className="font-mono text-xs uppercase tracking-widest text-trophy-300">Líder</p>
        <p className="font-display text-trophy-50 text-2xl sm:text-3xl leading-none truncate group-hover:text-trophy-200 transition-colors">
          {leader.teamName}
        </p>
        <p className="text-pitch-200 text-sm mt-0.5">{leader.participantName}</p>
      </Link>
      <div className="text-right shrink-0">
        <p className="font-display text-trophy-100 text-4xl sm:text-5xl leading-none tabular-nums">
          {formatPoints(leader.points)}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-trophy-700 mt-1">puntos</p>
      </div>
    </div>
  );
}

function StandingTr({ row, position }: { row: StandingRow; position: number }) {
  const topThree = position <= 3;
  return (
    <tr className="border-b border-pitch-800 last:border-0 hover:bg-pitch-800/40">
      <td
        className={cn(
          'px-4 py-3 font-display text-xl text-center',
          topThree ? 'text-trophy-300' : 'text-pitch-400',
        )}
      >
        {position}
      </td>
      <td className="px-4 py-3">
        <Link href={`/porra/${row.id}`} className="block group">
          <p className="font-display text-pitch-50 text-lg leading-tight group-hover:text-trophy-200 transition-colors">
            {row.teamName}
          </p>
          <p className="text-pitch-300 text-xs">{row.participantName}</p>
        </Link>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="flex items-center gap-2 text-sm">
          <span aria-hidden>{row.goldenBootFlag ?? '⚽'}</span>
          <span className="text-pitch-200 truncate">{row.goldenBootName}</span>
          {row.goldenBootIsWinner && <span className="tag-accent text-[9px]">Bota</span>}
          <span className="font-mono text-xs text-pitch-400">· {row.goldenBootGoals}g</span>
        </span>
      </td>
      <td className="px-4 py-3 text-right font-display text-trophy-100 text-2xl tabular-nums">
        {formatPoints(row.points)}
      </td>
    </tr>
  );
}

function statusLine(status: TournamentStatus): string {
  if (status.finished) return 'Mundial finalizado · clasificación final';
  if (status.matchesPlayed === 0) {
    return 'El Mundial aún no ha empezado. Las puntuaciones se actualizan con cada resultado.';
  }
  const phase = status.currentStage ? stageLabel(status.currentStage) : '';
  return `${phase ? `${phase} · ` : ''}${status.matchesPlayed}/${status.total} partidos jugados`;
}

function TrophyMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 4h16v6c0 4.4-3.6 8-8 8s-8-3.6-8-8V4z" stroke="#d8932f" strokeWidth="1.5" fill="#173817" />
      <path d="M8 7C5.5 7 4 8.5 4 11s1.5 4 4 4M24 7c2.5 0 4 1.5 4 4s-1.5 4-4 4" stroke="#d8932f" strokeWidth="1.5" />
      <path d="M12 18v4h8v-4" stroke="#d8932f" strokeWidth="1.5" />
      <path d="M10 26h12" stroke="#d8932f" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 22v4M18 22v4" stroke="#d8932f" strokeWidth="1.5" />
    </svg>
  );
}

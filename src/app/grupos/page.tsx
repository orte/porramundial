import { PublicHeader } from '@/components/PublicHeader';
import { getGroupStandings, type GroupStanding, type GroupStandingRow } from '@/lib/queries-public';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Grupos · Porra Mundial 2026' };

export default async function GruposPage() {
  const groups = await getGroupStandings();

  return (
    <main className="relative z-10 min-h-screen">
      <PublicHeader active="grupos" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-trophy-50 text-5xl sm:text-6xl">Grupos</h1>
          <p className="text-pitch-200 mt-2">
            Clasificación de cada grupo, calculada con los resultados (3 puntos por victoria,
            1 por empate). Cuando un grupo se cierra, el <span className="text-trophy-300">1º y 2º</span>{' '}
            quedan resaltados y los eliminados atenuados.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((g) => (
            <GroupCard key={g.groupCode} group={g} />
          ))}
        </div>
      </div>
    </main>
  );
}

function GroupCard({ group }: { group: GroupStanding }) {
  // Si el grupo está cerrado, ordenamos por la posición oficial asignada por el
  // admin; si no, por la clasificación calculada (puntos → DG → GF).
  const rows = group.closed
    ? [...group.rows].sort(
        (a, b) => (a.team.groupPosition ?? 99) - (b.team.groupPosition ?? 99),
      )
    : group.rows;

  return (
    <div className="panini-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-trophy-100 text-2xl">Grupo {group.groupCode}</h2>
        {group.closed && <span className="tag-accent">Cerrado</span>}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-pitch-300 border-b border-pitch-700">
            <Th className="w-6 text-left">#</Th>
            <Th className="text-left">Equipo</Th>
            <Th>PJ</Th>
            <Th>G</Th>
            <Th>E</Th>
            <Th>P</Th>
            <Th className="hidden sm:table-cell">GF</Th>
            <Th className="hidden sm:table-cell">GC</Th>
            <Th className="hidden sm:table-cell">DG</Th>
            <Th className="text-trophy-300">Pts</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <TeamRow key={row.team.id} row={row} position={idx + 1} closed={group.closed} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamRow({
  row,
  position,
  closed,
}: {
  row: GroupStandingRow;
  position: number;
  closed: boolean;
}) {
  const pos = row.team.groupPosition;
  const qualified = closed && pos != null && pos <= 2;
  const eliminated = closed && pos != null && pos >= 3;

  return (
    <tr
      className={cn(
        'border-b border-pitch-800/70 last:border-0',
        qualified && 'bg-trophy-950/30',
        eliminated && 'opacity-45',
      )}
    >
      <td
        className={cn(
          'py-2 pl-1 font-display text-center',
          qualified ? 'text-trophy-300' : 'text-pitch-400',
        )}
      >
        {position}
      </td>
      <td className="py-2">
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0" aria-hidden>
            {row.team.flag}
          </span>
          <span className="font-display text-pitch-50 leading-tight truncate">
            {row.team.name}
          </span>
        </span>
      </td>
      <Td>{row.played}</Td>
      <Td>{row.won}</Td>
      <Td>{row.drawn}</Td>
      <Td>{row.lost}</Td>
      <Td className="hidden sm:table-cell">{row.goalsFor}</Td>
      <Td className="hidden sm:table-cell">{row.goalsAgainst}</Td>
      <Td className="hidden sm:table-cell">{formatDiff(row.goalDiff)}</Td>
      <td className="py-2 text-center font-display text-trophy-100 text-base">{row.points}</td>
    </tr>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`font-mono text-[10px] uppercase tracking-wider px-1 py-2 text-center font-normal ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2 text-center font-mono text-pitch-200 ${className}`}>{children}</td>;
}

function formatDiff(n: number): string {
  return n > 0 ? `+${n}` : n.toString();
}

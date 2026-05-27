import Link from 'next/link';
import { db } from '@/db';
import { entries, players, teams } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function ClasificacionPage() {
  const rows = await db
    .select({
      id: entries.id,
      participantName: entries.participantName,
      teamName: entries.teamName,
      points: entries.points,
      totalSpent: entries.totalSpent,
      goldenBootName: players.name,
      goldenBootFlag: teams.flag,
    })
    .from(entries)
    .innerJoin(players, eq(entries.goldenBootPlayerId, players.id))
    .leftJoin(teams, eq(players.teamId, teams.id))
    .orderBy(desc(entries.points), desc(entries.createdAt));

  return (
    <main className="relative z-10 min-h-screen">
      <header className="border-b border-pitch-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-trophy-300 hover:text-trophy-200 tracking-widest text-sm transition-colors"
          >
            ← Inicio
          </Link>
          <p className="font-display tracking-widest text-pitch-300 text-xs">
            Clasificación
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-trophy-50 text-5xl sm:text-6xl">
            Clasificación
          </h1>
          <p className="text-pitch-200 mt-2">
            Las puntuaciones se actualizan cada vez que el admin marca el resultado
            de un partido.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="panini-card p-10 text-center">
            <p className="font-display text-2xl text-trophy-200 mb-3">
              Aún no hay porras
            </p>
            <p className="text-pitch-300 mb-6">
              Sé el primero en participar y empieza la liguilla.
            </p>
            <Link href="/nueva-porra" className="btn-primary">
              Crear la primera porra
            </Link>
          </div>
        ) : (
          <div className="panini-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-pitch-700 text-left">
                  <th className="font-mono text-xs uppercase tracking-widest text-pitch-300 px-4 py-3 w-12">
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
                  <tr
                    key={row.id}
                    className="border-b border-pitch-800 last:border-0 hover:bg-pitch-800/40"
                  >
                    <td className="px-4 py-3 font-display text-trophy-300 text-xl">
                      {idx + 1}
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
                      <span className="text-pitch-200 text-sm">
                        {row.goldenBootFlag ?? '⚽'} {row.goldenBootName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-display text-trophy-100 text-2xl">
                      {formatPoints(row.points)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function formatPoints(n: number): string {
  const rounded = Math.round(n * 2) / 2;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace('.', ',');
}

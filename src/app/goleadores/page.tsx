import { PublicHeader } from '@/components/PublicHeader';
import { getScorersForAdmin, type AdminScorer } from '@/lib/queries-admin';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Goleadores · Porra Mundial 2026' };

export default async function GoleadoresPage() {
  const scorers = await getScorersForAdmin();

  // Sección A: jugadores con al menos 1 gol, por goles desc.
  const conGoles = scorers
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
  const ranks = competitionRanks(conGoles.map((s) => s.goals));

  // Sección B: candidatos elegidos por al menos 1 porra.
  const elegidos = scorers
    .filter((s) => s.pickedBy > 0)
    .sort((a, b) => b.pickedBy - a.pickedBy || b.goals - a.goals || a.name.localeCompare(b.name));

  return (
    <main className="relative z-10 min-h-screen">
      <PublicHeader active="goleadores" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-trophy-50 text-5xl sm:text-6xl">Goleadores</h1>
          <p className="text-pitch-200 mt-2">
            Máximos goleadores del torneo y las apuestas a Bota de Oro de cada porra.
          </p>
        </div>

        {/* ── Sección A: tabla de goleadores ── */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
              Pichichi del Mundial
            </h2>
            <div className="flex-1 h-px bg-pitch-800" />
          </div>

          {conGoles.length === 0 ? (
            <div className="panini-card p-8 text-center text-pitch-300 text-sm">
              Aún no se han registrado goles.
            </div>
          ) : (
            <div className="panini-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-pitch-700 text-left">
                    <Th className="w-12 text-center">#</Th>
                    <Th>Jugador</Th>
                    <Th className="text-right">Goles</Th>
                  </tr>
                </thead>
                <tbody>
                  {conGoles.map((s, idx) => (
                    <ScorerRow key={s.id} scorer={s} rank={ranks[idx]} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Sección B: elecciones de las porras ── */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
              Apuestas de las porras
            </h2>
            <div className="flex-1 h-px bg-pitch-800" />
          </div>
          <p className="text-pitch-300 text-sm mb-4">
            Candidatos a Bota de Oro elegidos por al menos una porra, con sus goles actuales.
          </p>

          {elegidos.length === 0 ? (
            <div className="panini-card p-8 text-center text-pitch-300 text-sm">
              Todavía no hay porras con goleador elegido.
            </div>
          ) : (
            <div className="panini-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-pitch-700 text-left">
                    <Th>Jugador</Th>
                    <Th className="text-center">Goles</Th>
                    <Th className="text-right">Porras</Th>
                  </tr>
                </thead>
                <tbody>
                  {elegidos.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-pitch-800 last:border-0 hover:bg-pitch-800/40"
                    >
                      <td className="px-4 py-3">
                        <PlayerCell scorer={s} />
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-pitch-100">{s.goals}</td>
                      <td className="px-4 py-3 text-right font-display text-trophy-100 text-xl">
                        {s.pickedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ScorerRow({ scorer, rank }: { scorer: AdminScorer; rank: number }) {
  return (
    <tr
      className={cn(
        'border-b border-pitch-800 last:border-0 hover:bg-pitch-800/40',
        scorer.isGoldenBoot && 'bg-trophy-950/30',
      )}
    >
      <td
        className={cn(
          'px-4 py-3 text-center font-display text-xl',
          scorer.isGoldenBoot ? 'text-trophy-300' : 'text-pitch-400',
        )}
      >
        {rank}
      </td>
      <td className="px-4 py-3">
        <PlayerCell scorer={scorer} />
      </td>
      <td className="px-4 py-3 text-right font-display text-trophy-100 text-2xl">{scorer.goals}</td>
    </tr>
  );
}

function PlayerCell({ scorer }: { scorer: AdminScorer }) {
  return (
    <span className="flex items-center gap-3 min-w-0">
      <span className="text-xl shrink-0" aria-hidden>
        {scorer.teamFlag ?? '⚽'}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-display text-pitch-50 text-base leading-tight truncate">
            {scorer.name}
          </span>
          {scorer.isGoldenBoot && <span className="tag-accent text-[10px]">Bota de Oro</span>}
          {scorer.isCustom && !scorer.isGoldenBoot && (
            <span className="tag text-[10px]">Custom</span>
          )}
        </span>
        <span className="block text-pitch-300 text-xs mt-0.5">
          {scorer.teamName ?? 'Sin equipo'}
        </span>
      </span>
    </span>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`font-mono text-xs uppercase tracking-widest text-pitch-300 px-4 py-3 ${className}`}>
      {children}
    </th>
  );
}

/** Ranking con empates: mismos goles comparten posición (1,1,3,…). */
function competitionRanks(values: number[]): number[] {
  const ranks: number[] = [];
  let prev: number | null = null;
  let rank = 0;
  values.forEach((v, idx) => {
    if (prev === null || v < prev) rank = idx + 1;
    ranks.push(rank);
    prev = v;
  });
  return ranks;
}

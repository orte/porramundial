import { getAllTeamsRef, getKnockoutMatches, type AdminMatch } from '@/lib/queries-admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { KnockoutEditor } from '@/components/admin/KnockoutEditor';
import { stageLabel } from '@/lib/stages';
import type { Match } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Eliminatorias · Admin' };

type Stage = Match['stage'];

export default async function AdminEliminatoriasPage() {
  const [matches, teams] = await Promise.all([getKnockoutMatches(), getAllTeamsRef()]);

  // Agrupar por ronda, manteniendo el orden de aparición (por matchNumber).
  const byStage = new Map<Stage, AdminMatch[]>();
  for (const m of matches) {
    const arr = byStage.get(m.stage);
    if (arr) arr.push(m);
    else byStage.set(m.stage, [m]);
  }

  return (
    <div className="px-5 sm:px-8 py-8 max-w-4xl">
      <PageHeader
        title="Cruces de eliminatorias"
        description="Asigna los equipos a cada cruce a medida que se conocen. El hint gris recuerda el origen del slot (ej. «1A», «Ganador 73»)."
      />

      <div className="space-y-8">
        {[...byStage.entries()].map(([stage, stageMatches]) => (
          <section key={stage}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
                {stageLabel(stage)}
              </h2>
              <div className="flex-1 h-px bg-pitch-800" />
            </div>
            <div className="space-y-3">
              {stageMatches.map((m) => (
                <KnockoutEditor key={m.id} match={m} teams={teams} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

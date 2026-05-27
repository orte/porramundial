import { getScorersForAdmin } from '@/lib/queries-admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { GoldenBootSelector } from '@/components/admin/GoldenBootSelector';
import { ScorerRow } from '@/components/admin/ScorerRow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Goleadores · Admin' };

export default async function AdminGoleadoresPage() {
  const scorers = await getScorersForAdmin();
  const preset = scorers.filter((s) => !s.isCustom);
  const custom = scorers.filter((s) => s.isCustom);
  const currentGoldenBoot = scorers.find((s) => s.isGoldenBoot)?.id ?? null;

  return (
    <div className="px-5 sm:px-8 py-8 max-w-3xl">
      <PageHeader
        title="Goleadores"
        description="Actualiza los goles de cada candidato (+3 por gol a quien lo eligió) y marca la Bota de Oro del torneo. Al guardar se recalculan los puntos."
      />

      <div className="mb-8">
        <GoldenBootSelector players={scorers} currentId={currentGoldenBoot} />
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
            Candidatos preset
          </h2>
          <div className="flex-1 h-px bg-pitch-800" />
        </div>
        <div className="panini-card divide-y divide-pitch-800">
          {preset.map((s) => (
            <ScorerRow key={s.id} scorer={s} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-display text-trophy-300 text-sm tracking-widest uppercase">
            Jugadores «Otro» (custom)
          </h2>
          <div className="flex-1 h-px bg-pitch-800" />
        </div>
        {custom.length === 0 ? (
          <div className="panini-card p-6 text-center text-pitch-300 text-sm">
            Ningún participante ha elegido la opción «Otro» todavía.
          </div>
        ) : (
          <div className="panini-card divide-y divide-pitch-800">
            {custom.map((s) => (
              <ScorerRow key={s.id} scorer={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

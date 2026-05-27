import Link from 'next/link';
import { db } from '@/db';
import { teams, entries, matches } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { isLocked } from '@/lib/lock';

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

  // Si la DB aún no está poblada, evitamos romper la página
  try {
    stats = await getHomeStats();
    locked = await isLocked();
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
              Clasificación
            </Link>
            <Link
              href="/partidos"
              className="px-3 py-1.5 text-pitch-200 hover:text-trophy-300 transition-colors"
            >
              Partidos
            </Link>
            <Link
              href="/grupos"
              className="px-3 py-1.5 text-pitch-200 hover:text-trophy-300 transition-colors"
            >
              Grupos
            </Link>
            <Link
              href="/goleadores"
              className="px-3 py-1.5 text-pitch-200 hover:text-trophy-300 transition-colors"
            >
              Goleadores
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
              <span className="tag">11 jun → 19 jul</span>
              <span className="tag">48 selecciones</span>
            </div>

            <h1 className="font-display text-trophy-50 leading-[0.9] text-6xl sm:text-7xl md:text-8xl">
              Levanta
              <br />
              <span className="text-trophy-300">el trofeo</span>
              <br />
              con tus colegas.
            </h1>

            <p className="mt-8 text-pitch-100 text-lg max-w-xl leading-relaxed">
              Tienes <span className="text-trophy-300 font-semibold">100 millones</span> para
              fichar a <span className="text-trophy-300 font-semibold">5 selecciones</span> y
              un <span className="text-trophy-300 font-semibold">candidato a Bota de Oro</span>.
              Gana puntos por cada victoria, cada gol y cada eliminatoria superada. El que
              más sume al final del Mundial, levanta la porra.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {locked ? (
                <span className="btn-ghost cursor-not-allowed opacity-70">
                  🔒 Porras bloqueadas
                </span>
              ) : (
                <Link href="/nueva-porra" className="btn-primary">
                  Nueva porra
                  <ArrowRight />
                </Link>
              )}
              <Link href="/clasificacion" className="btn-ghost">
                Ver clasificación
              </Link>
            </div>

            {showLockedMsg && (
              <p className="mt-4 text-sm text-trophy-300 font-mono">
                El Mundial ha comenzado: las porras están cerradas. Puedes seguir la
                clasificación en directo.
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

      {/* ─── STATS ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Selecciones" value={stats.teams} suffix="/ 48" />
          <StatCard label="Partidos" value={stats.matches} suffix="/ 104" />
          <StatCard label="Porras" value={stats.entries} suffix="" />
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-3xl text-trophy-100 mb-2">
          Cómo se juega
        </h2>
        <p className="text-pitch-200 mb-10 max-w-2xl">
          Tres pasos, una sola oportunidad. Las porras se bloquean al iniciar el
          primer partido del Mundial.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <StepCard
            number="01"
            title="Ficha 5 selecciones"
            description="Con 100M€ de presupuesto. España y Francia son las más caras (45M€). Las menos favoritas, desde 2M€."
          />
          <StepCard
            number="02"
            title="Elige tu Bota de Oro"
            description="20 candidatos con precios entre 10M€ y 2M€. ¿Tienes una corazonada? Hay opción 'Otro' por 1M€."
          />
          <StepCard
            number="03"
            title="Suma puntos cada día"
            description="Victorias, goles, primer puesto de grupo, eliminatorias, Bota de Oro… Todo cuenta."
          />
        </div>
      </section>

      {/* ─── SCORING ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="panini-card-accent p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-trophy-400 font-display text-xs tracking-widest">
              Reglamento
            </span>
            <div className="flex-1 h-px bg-trophy-700/40" />
          </div>

          <h2 className="font-display text-3xl text-trophy-100 mb-8">
            Cómo se suman puntos
          </h2>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-3 text-pitch-100">
            <ScoringLine pts="+2" text="Partido ganado en los 90 minutos" />
            <ScoringLine pts="+1" text="Partido empatado en fase de grupos" />
            <ScoringLine pts="+1" text="Tu selección queda 1ª de grupo" />
            <ScoringLine pts="+0,5" text="Tu selección queda 2ª de grupo" />
            <ScoringLine pts="+2" text="Avanzar en una eliminatoria" />
            <ScoringLine pts="+1" text="Ganar el partido por el 3er puesto" />
            <ScoringLine pts="+4" text="Ganar el Mundial" />
            <ScoringLine pts="+3" text="Por cada gol de tu candidato a Bota de Oro" />
            <ScoringLine pts="+4" text="Si tu candidato es la Bota de Oro" />
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-pitch-800/50 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-pitch-300">
          <p className="font-mono">© 2026 · Porra entre amigos</p>
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

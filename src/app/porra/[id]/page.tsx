import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getEntryById } from '@/lib/queries-entry';
import { getAllPlayers, getAllTeams } from '@/lib/queries';
import { getEntryBreakdown, type PointsBreakdown } from '@/lib/queries-public';
import { isLocked, getLockDate } from '@/lib/lock';
import { formatSigned } from '@/lib/format';
import { EntryWizard } from '@/components/EntryWizard';
import { JustCreatedToast } from '@/components/JustCreatedToast';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ just?: string; token?: string; edit?: string }>;
};

export default async function PorraDetailPage({ params, searchParams }: Props) {
  const { id: idStr } = await params;
  const { just, token: tokenFromUrl, edit } = await searchParams;

  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const entry = await getEntryById(id);
  if (!entry) notFound();

  // Obtener token: prioridad URL > cookie
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(`porra_token_${id}`)?.value;
  const userToken = tokenFromUrl ?? tokenFromCookie;
  const isOwner = userToken === entry.editToken;

  const locked = await isLocked();
  const lockDate = await getLockDate();
  const canEdit = isOwner && !locked;

  // Si el usuario quiere editar y tiene permiso, mostramos el wizard
  if (edit === '1' && canEdit) {
    const [teams, players] = await Promise.all([getAllTeams(), getAllPlayers()]);
    const initialGoldenBoot: { type: 'preset'; playerId: number } | { type: 'custom'; name: string } =
      entry.goldenBoot.isCustom
        ? { type: 'custom', name: entry.goldenBoot.name }
        : { type: 'preset', playerId: entry.goldenBoot.id };

    return (
      <main className="relative z-10 min-h-screen">
        <header className="border-b border-pitch-800/50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href={`/porra/${id}`}
              className="font-display text-trophy-300 hover:text-trophy-200 tracking-widest text-sm transition-colors"
            >
              ← Utzi edizioa
            </Link>
            <p className="font-display tracking-widest text-pitch-300 text-xs">
              #{id} porra editatzen
            </p>
          </div>
        </header>
        <EntryWizard
          teams={teams}
          players={players}
          initial={{
            entryId: entry.id,
            editToken: entry.editToken,
            participantName: entry.participantName,
            teamName: entry.teamName,
            selectedTeamIds: entry.teams.map((t) => t.id),
            goldenBoot: initialGoldenBoot,
          }}
        />
      </main>
    );
  }

  // Desglose de puntos (solo si ya hay puntuación).
  const breakdown = entry.points > 0 ? await getEntryBreakdown(id) : null;

  return (
    <main className="relative z-10 min-h-screen">
      {/* Toast si acabamos de crearla */}
      {just === 'created' && <JustCreatedToast message="Porra ondo sortu da! 🎉" />}
      {just === 'updated' && <JustCreatedToast message="Porra eguneratuta ✓" />}

      <header className="border-b border-pitch-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-trophy-300 hover:text-trophy-200 tracking-widest text-sm transition-colors"
          >
            ← Hasiera
          </Link>
          <Link
            href="/clasificacion"
            className="font-display tracking-widest text-pitch-200 hover:text-trophy-300 text-xs transition-colors"
          >
            Sailkapena →
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Cabecera porra */}
        <div className="panini-card-accent p-8 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="tag-accent">PORRA #{entry.id.toString().padStart(3, '0')}</span>
            {locked ? (
              <span className="tag">BLOKEATUTA</span>
            ) : (
              <span className="tag">EDITAGARRI {formatDate(lockDate)} ARTE</span>
            )}
          </div>
          <h1 className="font-display text-trophy-50 text-5xl sm:text-6xl leading-none mb-2">
            {entry.teamName}
          </h1>
          <p className="text-pitch-200 text-lg">
            Kudeatzailea: <span className="text-trophy-300 font-semibold">{entry.participantName}</span>
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <Stat label="Puntuak" value={formatPoints(entry.points)} accent />
            <Stat label="Gastatua" value={`${entry.totalSpent}M€`} />
            <Stat label="Erabilgarri" value={`${100 - entry.totalSpent}M€`} />
          </div>
        </div>

        {/* Selecciones */}
        <section className="mb-6">
          <h2 className="font-display text-trophy-200 text-2xl mb-4">
            Taldea — 5 selekzio
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {entry.teams.map((team) => (
              <div key={team.id} className="panini-card p-3 flex flex-col items-center text-center gap-2">
                <span className="text-3xl">{team.flag}</span>
                <span className="font-display text-pitch-50 text-sm leading-tight">
                  {team.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="tag text-[10px]">{team.groupCode} multzoa</span>
                  <span className="font-mono text-xs text-trophy-300">
                    {team.price}M€
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Bota de oro */}
        <section className="mb-8">
          <h2 className="font-display text-trophy-200 text-2xl mb-4">
            Urrezko Bota hautagaia
          </h2>
          <div className="panini-card p-5 flex items-center gap-4">
            <span className="text-4xl">
              {entry.goldenBoot.teamFlag ?? '⚽'}
            </span>
            <div className="flex-1">
              <p className="font-display text-trophy-50 text-2xl leading-none">
                {entry.goldenBoot.name}
              </p>
              <p className="text-pitch-300 text-sm mt-1">
                {entry.goldenBoot.isCustom
                  ? 'Aukera librea · 1M€'
                  : `${entry.goldenBoot.teamName ?? ''} · ${entry.goldenBoot.price}M€`}
              </p>
            </div>
          </div>
        </section>

        {/* Desglose de puntos */}
        {breakdown && <BreakdownSection breakdown={breakdown} />}

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <Link href={`/porra/${id}?edit=1`} className="btn-primary">
              Editatu porra
            </Link>
          )}
          {locked && (
            <p className="text-pitch-300 text-sm font-mono">
              Porrak Mundiala hastean blokeatu ziren. Ezin dira editatu.
            </p>
          )}
          {!isOwner && !locked && (
            <p className="text-pitch-300 text-sm font-mono">
              Porra honen jabeak soilik (jatorrizko estekarekin) edita dezake.
            </p>
          )}
          <Link href="/clasificacion" className="btn-ghost">
            Ikusi sailkapena
          </Link>
        </div>

        {/* Tip de enlace personal */}
        {isOwner && !locked && (
          <div className="mt-10 panini-card p-5">
            <p className="font-display text-trophy-300 text-xs tracking-widest mb-2">
              GORDE ESTEKA HAU
            </p>
            <p className="text-pitch-200 text-sm mb-3">
              Hau da zure porraren esteka pribatua. Gorde ezazu geroago editatu nahi
              baduzu (Mundiala hasi arte). Beste gailu batetik sartu nahi baduzu, kopiatu
              beheko esteka osoa:
            </p>
            <code className="block bg-pitch-950 border border-pitch-700 rounded-sm px-3 py-2 text-xs text-trophy-200 font-mono break-all">
              /porra/{entry.id}?token={entry.editToken}
            </code>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-trophy-700 mb-1">
        {label}
      </p>
      <p className={`font-display text-3xl ${accent ? 'text-trophy-300' : 'text-trophy-100'}`}>
        {value}
      </p>
    </div>
  );
}

function BreakdownSection({ breakdown }: { breakdown: PointsBreakdown }) {
  const lines = [
    { label: 'Zure selekzioen partidak', value: breakdown.teamMatches },
    { label: 'Multzoko postuak (1. / 2.)', value: breakdown.groupPositions },
    { label: 'Zure goleatzailearen golak', value: breakdown.goldenBootGoals },
    { label: 'Urrezko Bota', value: breakdown.goldenBootWinner },
  ].filter((l) => l.value !== 0);

  return (
    <section className="mb-8">
      <h2 className="font-display text-trophy-200 text-2xl mb-4">Nola batu dituzun puntuak</h2>
      <div className="panini-card divide-y divide-pitch-800">
        {lines.map((l) => (
          <div key={l.label} className="flex items-center justify-between px-5 py-3">
            <span className="text-pitch-200 text-sm">{l.label}</span>
            <span className="font-display text-trophy-300 text-lg tabular-nums">
              {formatSigned(l.value)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between px-5 py-3 bg-pitch-800/30">
          <span className="font-display text-trophy-100 uppercase tracking-wider text-sm">Guztira</span>
          <span className="font-display text-trophy-100 text-2xl tabular-nums">
            {formatSigned(breakdown.total)}
          </span>
        </div>
      </div>
    </section>
  );
}

function formatPoints(n: number): string {
  const rounded = Math.round(n * 2) / 2;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1).replace('.', ',');
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('eu', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(d);
}

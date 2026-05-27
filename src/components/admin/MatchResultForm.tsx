'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { deleteMatchResult, saveMatchResult } from '@/app/actions/admin';
import { isKnockoutStage, winModeLabel } from '@/lib/stages';
import type { AdminMatch } from '@/lib/queries-admin';

function parse(s: string): number | null {
  const t = s.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function GoalInput({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      step={1}
      inputMode="numeric"
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-14 text-center bg-pitch-950 border border-pitch-700 focus:border-trophy-500
        focus:ring-2 focus:ring-trophy-700/30 outline-none rounded-sm px-2 py-2
        text-pitch-50 font-mono text-lg disabled:opacity-40"
    />
  );
}

export function MatchResultForm({ match }: { match: AdminMatch }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(0);

  const [hg, setHg] = useState(match.homeGoals?.toString() ?? '');
  const [ag, setAg] = useState(match.awayGoals?.toString() ?? '');
  const [he, setHe] = useState(match.homeGoalsAfterExtra?.toString() ?? '');
  const [ae, setAe] = useState(match.awayGoalsAfterExtra?.toString() ?? '');
  const [hp, setHp] = useState(match.homePenalties?.toString() ?? '');
  const [ap, setAp] = useState(match.awayPenalties?.toString() ?? '');

  const knockout = isKnockoutStage(match.stage);
  const hgN = parse(hg);
  const agN = parse(ag);
  const heN = parse(he);
  const aeN = parse(ae);

  const ninetyTied = knockout && hgN != null && agN != null && hgN === agN;
  const extraTied = ninetyTied && heN != null && aeN != null && heN === aeN;

  const canSave = hgN != null && agN != null && !isPending;

  function reset(toMatch: AdminMatch) {
    setHg(toMatch.homeGoals?.toString() ?? '');
    setAg(toMatch.awayGoals?.toString() ?? '');
    setHe(toMatch.homeGoalsAfterExtra?.toString() ?? '');
    setAe(toMatch.awayGoalsAfterExtra?.toString() ?? '');
    setHp(toMatch.homePenalties?.toString() ?? '');
    setAp(toMatch.awayPenalties?.toString() ?? '');
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveMatchResult({
        matchId: match.id,
        homeGoals: hgN ?? 0,
        awayGoals: agN ?? 0,
        homeGoalsAfterExtra: ninetyTied ? heN : null,
        awayGoalsAfterExtra: ninetyTied ? aeN : null,
        homePenalties: extraTied ? parse(hp) : null,
        awayPenalties: extraTied ? parse(ap) : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteMatchResult(match.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reset({ ...match, homeGoals: null, awayGoals: null });
      setHe('');
      setAe('');
      setHp('');
      setAp('');
      setSavedAt(0);
      router.refresh();
    });
  }

  const winnerName =
    match.winnerTeamId === match.home?.id
      ? match.home?.name
      : match.winnerTeamId === match.away?.id
        ? match.away?.name
        : null;

  return (
    <div className="space-y-3">
      {/* 90 minutos */}
      <div className="flex items-center gap-3">
        <TeamSide team={match.home} align="right" />
        <GoalInput value={hg} onChange={setHg} label="Goles local" disabled={isPending} />
        <span className="text-pitch-500 font-display">–</span>
        <GoalInput value={ag} onChange={setAg} label="Goles visitante" disabled={isPending} />
        <TeamSide team={match.away} align="left" />
      </div>

      {/* Prórroga */}
      {ninetyTied && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="font-mono text-xs uppercase tracking-wider text-trophy-300 w-24 text-right">
            Prórroga
          </span>
          <GoalInput value={he} onChange={setHe} label="Prórroga local" disabled={isPending} />
          <span className="text-pitch-500 font-display">–</span>
          <GoalInput value={ae} onChange={setAe} label="Prórroga visitante" disabled={isPending} />
          <span className="text-pitch-400 text-xs w-24">(total, incluye los 90')</span>
        </div>
      )}

      {/* Penaltis */}
      {extraTied && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="font-mono text-xs uppercase tracking-wider text-trophy-300 w-24 text-right">
            Penaltis
          </span>
          <GoalInput value={hp} onChange={setHp} label="Penaltis local" disabled={isPending} />
          <span className="text-pitch-500 font-display">–</span>
          <GoalInput value={ap} onChange={setAp} label="Penaltis visitante" disabled={isPending} />
          <span className="w-24" />
        </div>
      )}

      {error && (
        <div className="rounded-sm border border-red-700/60 bg-red-950/40 text-red-200 px-3 py-2 text-xs">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn('btn-primary text-sm py-2 px-4', !canSave && 'opacity-50 cursor-not-allowed')}
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </button>
        {match.played && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="btn-ghost text-sm py-2 px-4 border-red-800/70 text-red-300 hover:border-red-500 hover:text-red-200"
          >
            Borrar resultado
          </button>
        )}
        {savedAt > 0 && !error && (
          <span className="text-xs font-mono text-trophy-300">Guardado ✓</span>
        )}
        {match.played && winnerName && (
          <span className="tag-accent ml-auto">
            {winnerName} · {winModeLabel(match.winMode)}
          </span>
        )}
        {match.played && !winnerName && (
          <span className="tag ml-auto">Empate</span>
        )}
      </div>
    </div>
  );
}

function TeamSide({
  team,
  align,
}: {
  team: AdminMatch['home'];
  align: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'flex-1 min-w-0 flex items-center gap-2',
        align === 'right' ? 'justify-end text-right' : 'justify-start text-left',
      )}
    >
      {align === 'left' && <span className="text-xl shrink-0">{team?.flag}</span>}
      <span className="font-display text-pitch-50 text-sm leading-tight truncate">
        {team?.name}
      </span>
      {align === 'right' && <span className="text-xl shrink-0">{team?.flag}</span>}
    </div>
  );
}

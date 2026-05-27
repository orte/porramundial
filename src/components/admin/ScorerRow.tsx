'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { saveScorerGoals } from '@/app/actions/admin';
import type { AdminScorer } from '@/lib/queries-admin';

export function ScorerRow({ scorer }: { scorer: AdminScorer }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [goals, setGoals] = useState(scorer.goals.toString());
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const trimmed = goals.trim();
  const goalsN = trimmed === '' ? NaN : Number(trimmed);
  const valid = Number.isInteger(goalsN) && goalsN >= 0;
  const dirty = trimmed !== scorer.goals.toString();
  const canSave = !isPending && valid && dirty;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveScorerGoals(scorer.id, goalsN);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-xl shrink-0" aria-hidden>
        {scorer.teamFlag ?? '⚽'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-display text-pitch-50 text-sm leading-tight truncate flex items-center gap-2">
          {scorer.name}
          {scorer.isGoldenBoot && <span className="tag-accent text-[10px]">Bota de Oro</span>}
        </p>
        <p className="text-pitch-300 text-xs mt-0.5">
          {scorer.teamName ?? 'Sin equipo'} · {scorer.price}M€ ·{' '}
          {scorer.pickedBy === 0
            ? 'sin porras'
            : `${scorer.pickedBy} porra${scorer.pickedBy === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <label className="sr-only" htmlFor={`goals-${scorer.id}`}>
          Goles de {scorer.name}
        </label>
        <input
          id={`goals-${scorer.id}`}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={goals}
          disabled={isPending}
          onChange={(e) => {
            setSaved(false);
            setGoals(e.target.value);
          }}
          className="w-16 text-center bg-pitch-950 border border-pitch-700 focus:border-trophy-500
            focus:ring-2 focus:ring-trophy-700/30 outline-none rounded-sm px-2 py-1.5
            text-pitch-50 font-mono disabled:opacity-40"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'btn-primary text-xs py-1.5 px-3',
            !canSave && 'opacity-40 cursor-not-allowed',
          )}
        >
          {isPending ? '…' : 'Goles'}
        </button>
        {saved && !dirty && !error && (
          <span className="text-xs font-mono text-trophy-300" aria-live="polite">
            ✓
          </span>
        )}
      </div>

      {error && (
        <span className="text-xs text-red-300" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

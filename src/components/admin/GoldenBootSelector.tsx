'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { setGoldenBoot } from '@/app/actions/admin';
import type { AdminScorer } from '@/lib/queries-admin';

export function GoldenBootSelector({
  players,
  currentId,
}: {
  players: AdminScorer[];
  currentId: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(value: string) {
    startTransition(async () => {
      await setGoldenBoot(value === '' ? null : Number(value));
      router.refresh();
    });
  }

  return (
    <div className="panini-card-accent p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-trophy-300 mb-1">
        Bota de Oro del torneo
      </p>
      <p className="text-pitch-200 text-sm mb-4">
        Quien la gane suma +4 a las porras que lo eligieron. Marca uno solo (o ninguno).
      </p>
      <select
        value={currentId?.toString() ?? ''}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Bota de Oro del torneo"
        className={cn(
          'w-full bg-pitch-950 border border-trophy-700 focus:border-trophy-400',
          'focus:ring-2 focus:ring-trophy-700/30 outline-none rounded-sm px-3 py-2.5',
          'text-pitch-50 font-display tracking-wide text-base',
          isPending && 'opacity-60',
        )}
      >
        <option value="">— Sin Bota de Oro —</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {(p.teamFlag ?? '⚽') + ' '}
            {p.name}
            {p.isCustom ? ' · custom' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

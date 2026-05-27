'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/cn';
import { recalcPointsManually } from '@/app/actions/admin';

export function RecalcButton() {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleClick() {
    setDone(false);
    startTransition(async () => {
      await recalcPointsManually();
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn('btn-ghost text-sm', isPending && 'opacity-60 cursor-wait')}
    >
      {isPending ? 'Recalculando…' : done ? 'Recalculado ✓' : 'Recalcular puntos'}
    </button>
  );
}

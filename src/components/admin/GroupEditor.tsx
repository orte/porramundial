'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { saveGroupPositions } from '@/app/actions/admin';
import type { AdminGroup } from '@/lib/queries-admin';

export function GroupEditor({ group }: { group: AdminGroup }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [positions, setPositions] = useState<Record<number, number | null>>(() => {
    const init: Record<number, number | null> = {};
    for (const t of group.teams) init[t.id] = t.groupPosition;
    return init;
  });

  function assign(teamId: number, pos: number) {
    setSaved(false);
    setPositions((prev) => {
      const next = { ...prev };
      // Toggle: si ya tenía esa posición, la quitamos.
      if (next[teamId] === pos) {
        next[teamId] = null;
        return next;
      }
      // Quitamos esa posición a quien la tuviera (no puede haber dos iguales).
      for (const id of Object.keys(next)) {
        if (next[Number(id)] === pos) next[Number(id)] = null;
      }
      next[teamId] = pos;
      return next;
    });
  }

  const assignedCount = Object.values(positions).filter((p) => p != null).length;
  const closed = assignedCount === 4;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveGroupPositions({
        groupCode: group.groupCode,
        positions: group.teams.map((t) => ({ teamId: t.id, position: positions[t.id] ?? null })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="panini-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-trophy-100 text-2xl">Grupo {group.groupCode}</h2>
        {closed ? (
          <span className="tag-accent">Cerrado</span>
        ) : (
          <span className="tag">{assignedCount}/4</span>
        )}
      </div>

      <div className="space-y-2">
        {group.teams.map((t) => {
          const pos = positions[t.id];
          const eliminated = pos === 3 || pos === 4;
          return (
            <div key={t.id} className="flex items-center gap-2">
              <span className="text-xl shrink-0" aria-hidden>
                {t.flag}
              </span>
              <span
                className={cn(
                  'flex-1 min-w-0 font-display text-sm truncate',
                  eliminated ? 'text-pitch-400 line-through decoration-pitch-600' : 'text-pitch-50',
                )}
              >
                {t.name}
              </span>
              <div className="flex gap-1 shrink-0">
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => assign(t.id, p)}
                    aria-label={`${t.name}: posición ${p}`}
                    className={cn(
                      'w-8 h-8 rounded-sm font-display text-sm border transition-colors',
                      pos === p && p <= 2 && 'border-trophy-400 bg-trophy-400 text-pitch-950',
                      pos === p && p > 2 && 'border-pitch-500 bg-pitch-700 text-pitch-100',
                      pos !== p && 'border-pitch-700 text-pitch-300 hover:border-pitch-500',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-3 rounded-sm border border-red-700/60 bg-red-950/40 text-red-200 px-3 py-2 text-xs">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={cn('btn-primary text-sm py-2 px-4', isPending && 'opacity-60 cursor-wait')}
        >
          {isPending ? 'Guardando…' : 'Guardar grupo'}
        </button>
        {saved && !error && <span className="text-xs font-mono text-trophy-300">Guardado ✓</span>}
        <span className="ml-auto text-[11px] text-pitch-400">3º y 4º quedan eliminados</span>
      </div>
    </div>
  );
}

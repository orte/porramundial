'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { saveLockDate } from '@/app/actions/admin';

/** Date → valor YYYY-MM-DDTHH:mm en horario local del navegador. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ConfigForm({ lockDateISO }: { lockDateISO: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(() => toLocalInput(new Date(lockDateISO)));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      setError('Fecha inválida.');
      return;
    }
    startTransition(async () => {
      const result = await saveLockDate(d.toISOString());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panini-card p-6 max-w-lg">
      <label className="block">
        <span className="font-display text-trophy-300 text-sm uppercase tracking-widest">
          Fecha de bloqueo
        </span>
        <span className="block text-pitch-300 text-xs mt-0.5 mb-3">
          A partir de esta fecha y hora no se pueden crear ni editar porras. Se interpreta en
          la hora local de tu navegador.
        </span>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => {
            setSaved(false);
            setValue(e.target.value);
          }}
          className="w-full bg-pitch-950 border border-pitch-700 focus:border-trophy-500
            focus:ring-2 focus:ring-trophy-700/30 outline-none rounded-sm px-4 py-3
            text-pitch-50 font-mono tracking-wide"
        />
      </label>

      {error && (
        <div className="mt-4 rounded-sm border border-red-700/60 bg-red-950/40 text-red-200 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={cn('btn-primary text-sm', isPending && 'opacity-60 cursor-wait')}
        >
          {isPending ? 'Guardando…' : 'Guardar fecha'}
        </button>
        {saved && !error && <span className="text-xs font-mono text-trophy-300">Guardado ✓</span>}
      </div>
    </form>
  );
}

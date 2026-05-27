'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { login } from '@/app/actions/admin';

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await login(password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace('/admin');
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panini-card p-8">
      <h1 className="font-display text-3xl text-trophy-100 mb-2">Panel admin</h1>
      <p className="text-pitch-200 text-sm mb-8">
        Acceso restringido. Introduce la contraseña para gestionar el torneo.
      </p>

      <label className="block">
        <span className="font-display text-trophy-300 text-sm uppercase tracking-widest">
          Contraseña
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          placeholder="••••••••"
          className="mt-2 w-full bg-pitch-950 border border-pitch-700 focus:border-trophy-500
            focus:ring-2 focus:ring-trophy-700/30 outline-none rounded-sm px-4 py-3
            text-pitch-50 placeholder:text-pitch-500 font-mono tracking-wide text-lg"
        />
      </label>

      {error && (
        <div className="mt-4 rounded-sm border border-red-700/60 bg-red-950/40 text-red-200 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || password.length === 0}
        className={cn(
          'btn-primary w-full mt-6',
          (isPending || password.length === 0) && 'opacity-50 cursor-not-allowed',
        )}
      >
        {isPending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}

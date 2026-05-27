'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { saveKnockoutTeams } from '@/app/actions/admin';
import type { AdminMatch, TeamRef } from '@/lib/queries-admin';
import { stageLabel } from '@/lib/stages';
import { formatShort } from '@/lib/dates';

type TeamOption = TeamRef & { groupCode: string };

function TeamSelect({
  value,
  onChange,
  placeholder,
  teams,
  disabled,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string | null;
  teams: TeamOption[];
  disabled: boolean;
  label: string;
}) {
  return (
    <label className="block flex-1 min-w-0">
      <span className="block font-mono text-[11px] uppercase tracking-wider text-pitch-400 mb-1">
        {placeholder ?? label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full bg-pitch-950 border border-pitch-700 focus:border-trophy-500
          focus:ring-2 focus:ring-trophy-700/30 outline-none rounded-sm px-3 py-2
          text-pitch-50 text-sm"
      >
        <option value="">— Sin asignar —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.flag} {t.name} ({t.groupCode})
          </option>
        ))}
      </select>
    </label>
  );
}

export function KnockoutEditor({ match, teams }: { match: AdminMatch; teams: TeamOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [homeId, setHomeId] = useState(match.homeTeamId?.toString() ?? '');
  const [awayId, setAwayId] = useState(match.awayTeamId?.toString() ?? '');

  const sameTeam = homeId !== '' && homeId === awayId;
  const canSave = !isPending && !sameTeam;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveKnockoutTeams({
        matchId: match.id,
        homeTeamId: homeId === '' ? null : Number(homeId),
        awayTeamId: awayId === '' ? null : Number(awayId),
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
    <div className="panini-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-pitch-400">#{match.matchNumber}</span>
          <span className="tag text-[10px]">{stageLabel(match.stage)}</span>
        </span>
        <span className="font-mono text-xs text-pitch-300">
          {match.kickoff ? formatShort(match.kickoff) : '—'}
        </span>
      </div>

      <div className="flex items-end gap-3">
        <TeamSelect
          value={homeId}
          onChange={(v) => {
            setSaved(false);
            setHomeId(v);
          }}
          placeholder={match.homePlaceholder}
          teams={teams}
          disabled={isPending}
          label="Equipo local"
        />
        <span className="text-pitch-500 font-display pb-2">vs</span>
        <TeamSelect
          value={awayId}
          onChange={(v) => {
            setSaved(false);
            setAwayId(v);
          }}
          placeholder={match.awayPlaceholder}
          teams={teams}
          disabled={isPending}
          label="Equipo visitante"
        />
      </div>

      {sameTeam && (
        <p className="mt-2 text-xs text-red-300">Un equipo no puede jugar contra sí mismo.</p>
      )}
      {error && (
        <div className="mt-2 rounded-sm border border-red-700/60 bg-red-950/40 text-red-200 px-3 py-2 text-xs">
          {error}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn('btn-primary text-sm py-2 px-4', !canSave && 'opacity-50 cursor-not-allowed')}
        >
          {isPending ? 'Guardando…' : 'Guardar cruce'}
        </button>
        {saved && !error && <span className="text-xs font-mono text-trophy-300">Guardado ✓</span>}
      </div>
    </div>
  );
}

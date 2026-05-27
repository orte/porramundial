'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { BUDGET, MAX_TEAMS_BUDGET, MIN_GOLDEN_BOOT_COST, TEAMS_TO_PICK } from '@/lib/constants';
import { createEntry, updateEntry, type EntryFormInput } from '@/app/actions/entry';
import type { PlayerForPicker, TeamForPicker } from '@/lib/queries';

type Props = {
  teams: TeamForPicker[];
  players: PlayerForPicker[];
  // Para modo edición:
  initial?: {
    entryId: number;
    editToken: string;
    participantName: string;
    teamName: string;
    selectedTeamIds: number[];
    goldenBoot:
      | { type: 'preset'; playerId: number }
      | { type: 'custom'; name: string };
  };
};

type Step = 1 | 2 | 3;

export function EntryWizard({ teams, players, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>(1);
  const [participantName, setParticipantName] = useState(initial?.participantName ?? '');
  const [teamName, setTeamName] = useState(initial?.teamName ?? '');
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>(
    initial?.selectedTeamIds ?? [],
  );
  const [goldenBootMode, setGoldenBootMode] = useState<'preset' | 'custom'>(
    initial?.goldenBoot?.type ?? 'preset',
  );
  const [goldenBootPlayerId, setGoldenBootPlayerId] = useState<number | null>(
    initial?.goldenBoot?.type === 'preset' ? initial.goldenBoot.playerId : null,
  );
  const [customPlayerName, setCustomPlayerName] = useState<string>(
    initial?.goldenBoot?.type === 'custom' ? initial.goldenBoot.name : '',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presetPlayers = useMemo(() => players.filter((p) => !p.isCustom), [players]);

  const teamsCost = useMemo(
    () =>
      selectedTeamIds.reduce(
        (acc, id) => acc + (teams.find((t) => t.id === id)?.price ?? 0),
        0,
      ),
    [selectedTeamIds, teams],
  );

  const playerCost = useMemo(() => {
    if (goldenBootMode === 'custom') return 1;
    const p = presetPlayers.find((x) => x.id === goldenBootPlayerId);
    return p?.price ?? 0;
  }, [goldenBootMode, goldenBootPlayerId, presetPlayers]);

  const totalCost = teamsCost + playerCost;
  const remaining = BUDGET - totalCost;
  const overBudget = remaining < 0;

  // Habilitación de pasos
  const step1Valid = participantName.trim().length >= 2 && teamName.trim().length >= 2;
  const step2Valid = selectedTeamIds.length === TEAMS_TO_PICK && teamsCost <= MAX_TEAMS_BUDGET;
  const step3Valid =
    (goldenBootMode === 'preset' && goldenBootPlayerId !== null) ||
    (goldenBootMode === 'custom' && customPlayerName.trim().length >= 2);

  const allValid = step1Valid && step2Valid && step3Valid && !overBudget;

  function toggleTeam(teamId: number) {
    setErrorMsg(null);
    setSelectedTeamIds((prev) => {
      if (prev.includes(teamId)) return prev.filter((id) => id !== teamId);
      if (prev.length >= TEAMS_TO_PICK) return prev;
      const team = teams.find((t) => t.id === teamId);
      if (!team) return prev;
      // Comprobar presupuesto al añadir, reservando el coste actual del
      // goleador o el mínimo (1M€) si aún no se ha elegido.
      const reservedForPlayer = Math.max(playerCost, MIN_GOLDEN_BOOT_COST);
      const newTeamsCost =
        prev.reduce((acc, id) => acc + (teams.find((t) => t.id === id)?.price ?? 0), 0) +
        team.price;
      if (newTeamsCost + reservedForPlayer > BUDGET) {
        setErrorMsg(
          `No te llega el presupuesto para añadir ${team.name} (se reserva ${reservedForPlayer}M€ para el goleador).`,
        );
        return prev;
      }
      return [...prev, teamId];
    });
  }

  function selectPresetPlayer(playerId: number) {
    setErrorMsg(null);
    const player = presetPlayers.find((p) => p.id === playerId);
    if (!player) return;
    if (teamsCost + player.price > BUDGET) {
      setErrorMsg(`No te llega el presupuesto para ${player.name}.`);
      return;
    }
    setGoldenBootMode('preset');
    setGoldenBootPlayerId(playerId);
  }

  async function handleSubmit() {
    setErrorMsg(null);
    const input: EntryFormInput = {
      participantName: participantName.trim(),
      teamName: teamName.trim(),
      selectedTeamIds,
      goldenBootChoice:
        goldenBootMode === 'preset' && goldenBootPlayerId !== null
          ? { type: 'preset', playerId: goldenBootPlayerId }
          : { type: 'custom', name: customPlayerName.trim() },
    };

    startTransition(async () => {
      const result = initial
        ? await updateEntry(initial.entryId, initial.editToken, input)
        : await createEntry(input);

      if (!result.ok) {
        setErrorMsg(result.error);
        return;
      }
      router.push(`/porra/${result.entryId}?just=${initial ? 'updated' : 'created'}`);
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header con pasos */}
      <Steps current={step} onJump={(s) => {
        if (s === 1) setStep(1);
        if (s === 2 && step1Valid) setStep(2);
        if (s === 3 && step1Valid && step2Valid) setStep(3);
      }} />

      {/* Indicador de presupuesto sticky */}
      <BudgetBar
        teamsCost={teamsCost}
        playerCost={playerCost}
        remaining={remaining}
        overBudget={overBudget}
      />

      {/* Contenido del paso */}
      <div className="mt-8">
        {step === 1 && (
          <Step1
            participantName={participantName}
            teamName={teamName}
            onChangeParticipant={setParticipantName}
            onChangeTeamName={setTeamName}
          />
        )}

        {step === 2 && (
          <Step2
            teams={teams}
            selectedTeamIds={selectedTeamIds}
            onToggle={toggleTeam}
            playerCost={playerCost}
          />
        )}

        {step === 3 && (
          <Step3
            players={presetPlayers}
            mode={goldenBootMode}
            selectedPlayerId={goldenBootPlayerId}
            customName={customPlayerName}
            teamsCost={teamsCost}
            onSelectPreset={selectPresetPlayer}
            onSelectCustom={() => {
              setGoldenBootMode('custom');
              setGoldenBootPlayerId(null);
            }}
            onChangeCustomName={setCustomPlayerName}
          />
        )}
      </div>

      {/* Error global */}
      {errorMsg && (
        <div className="mt-6 rounded-sm border border-red-700/60 bg-red-950/40 text-red-200 px-4 py-3 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Navegación entre pasos */}
      <div className="mt-10 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="btn-ghost"
            disabled={isPending}
          >
            ← Atrás
          </button>
        ) : (
          <Link href="/" className="btn-ghost">
            ← Cancelar
          </Link>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && step1Valid) setStep(2);
              else if (step === 2 && step2Valid) setStep(3);
              else if (step === 1) setErrorMsg('Rellena tu nombre y el nombre del equipo.');
              else if (step === 2)
                setErrorMsg(`Tienes que elegir exactamente ${TEAMS_TO_PICK} selecciones.`);
            }}
            className="btn-primary"
            disabled={isPending}
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allValid || isPending}
            className={cn('btn-primary', (!allValid || isPending) && 'opacity-50 cursor-not-allowed')}
          >
            {isPending
              ? 'Guardando…'
              : initial
                ? 'Guardar cambios'
                : 'Confirmar porra ⚽'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── BARRA DE PRESUPUESTO ───────────────────────────────────────────────

function BudgetBar({
  teamsCost,
  playerCost,
  remaining,
  overBudget,
}: {
  teamsCost: number;
  playerCost: number;
  remaining: number;
  overBudget: boolean;
}) {
  const used = teamsCost + playerCost;
  const usedPct = Math.min(100, (used / BUDGET) * 100);
  // Si el usuario aún no ha elegido goleador, mostramos la franja reservada
  // de 1M€ como indicación visual de que está apartado para el Paso 3.
  const reservedPct = playerCost === 0 ? (MIN_GOLDEN_BOOT_COST / BUDGET) * 100 : 0;

  return (
    <div className="sticky top-2 z-20 mt-6 panini-card p-4 backdrop-blur-md bg-pitch-900/85">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <p className="font-mono text-xs uppercase tracking-widest text-pitch-300">
          Presupuesto
        </p>
        <p className={cn(
          'font-display tracking-wider text-lg',
          overBudget ? 'text-red-400' : 'text-trophy-100',
        )}>
          {used}M€ <span className="text-trophy-700 text-sm">/ {BUDGET}M€</span>
        </p>
      </div>

      <div className="relative h-2 bg-pitch-800 rounded-full overflow-hidden">
        {/* Franja gastada */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-all',
            overBudget ? 'bg-red-500' : 'bg-trophy-400',
          )}
          style={{ width: `${usedPct}%` }}
        />
        {/* Franja reservada (solo si aún no se ha elegido goleador) */}
        {reservedPct > 0 && (
          <div
            className="absolute inset-y-0 transition-all bg-trophy-400/25"
            style={{
              left: `${usedPct}%`,
              width: `${reservedPct}%`,
            }}
            aria-hidden
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-mono text-pitch-300 flex-wrap gap-2">
        <span>Equipos: <span className="text-pitch-100">{teamsCost}M€</span></span>
        <span>
          Goleador:{' '}
          <span className="text-pitch-100">
            {playerCost > 0 ? `${playerCost}M€` : `${MIN_GOLDEN_BOOT_COST}M€ reservado`}
          </span>
        </span>
        <span className={overBudget ? 'text-red-400' : 'text-trophy-300'}>
          Resto: <span className="font-semibold">{remaining}M€</span>
        </span>
      </div>
    </div>
  );
}

// ─── INDICADOR DE PASOS ─────────────────────────────────────────────────

function Steps({ current, onJump }: { current: Step; onJump: (s: Step) => void }) {
  const items: { id: Step; label: string }[] = [
    { id: 1, label: 'Tus datos' },
    { id: 2, label: 'Selecciones' },
    { id: 3, label: 'Bota de Oro' },
  ];
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4">
      {items.map((item, idx) => {
        const isActive = current === item.id;
        const isDone = current > item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onJump(item.id)}
            className={cn(
              'flex-1 group flex items-center gap-3 text-left',
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full border-2 font-display text-lg shrink-0 transition-colors',
                isActive && 'border-trophy-400 bg-trophy-400 text-pitch-950',
                isDone && 'border-trophy-600 bg-trophy-700/40 text-trophy-300',
                !isActive && !isDone && 'border-pitch-700 text-pitch-400',
              )}
            >
              {isDone ? '✓' : item.id}
            </span>
            <span className={cn(
              'font-display uppercase tracking-wider text-sm hidden sm:inline',
              isActive ? 'text-trophy-100' : 'text-pitch-300 group-hover:text-pitch-100',
            )}>
              {item.label}
            </span>
            {idx < items.length - 1 && (
              <span className="flex-1 h-px bg-pitch-800 ml-2 hidden sm:block" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── PASO 1: DATOS BÁSICOS ──────────────────────────────────────────────

function Step1({
  participantName,
  teamName,
  onChangeParticipant,
  onChangeTeamName,
}: {
  participantName: string;
  teamName: string;
  onChangeParticipant: (v: string) => void;
  onChangeTeamName: (v: string) => void;
}) {
  return (
    <div className="panini-card p-8">
      <h2 className="font-display text-3xl text-trophy-100 mb-2">
        Preséntate
      </h2>
      <p className="text-pitch-200 mb-8">
        Dinos quién eres y cómo se va a llamar tu equipo de la porra. Algo épico,
        si puede ser.
      </p>

      <div className="space-y-6">
        <Field
          label="Tu nombre"
          hint="El que aparecerá en la clasificación"
          value={participantName}
          onChange={onChangeParticipant}
          placeholder="Ej. Pedro"
          maxLength={40}
        />
        <Field
          label="Nombre del equipo"
          hint="Sé creativo: Los Magnates del Balón, La Banda del Codo, etc."
          value={teamName}
          onChange={onChangeTeamName}
          placeholder="Ej. Los Magnates del Balón"
          maxLength={40}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="font-display text-trophy-300 text-sm uppercase tracking-widest">
        {label}
      </span>
      {hint && (
        <span className="block text-pitch-300 text-xs mt-0.5 mb-2">{hint}</span>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-2 w-full bg-pitch-950 border border-pitch-700 focus:border-trophy-500
          focus:ring-2 focus:ring-trophy-700/30 outline-none rounded-sm px-4 py-3
          text-pitch-50 placeholder:text-pitch-500 font-display tracking-wide text-xl"
      />
    </label>
  );
}

// ─── PASO 2: SELECCIONES ────────────────────────────────────────────────

function Step2({
  teams,
  selectedTeamIds,
  onToggle,
  playerCost,
}: {
  teams: TeamForPicker[];
  selectedTeamIds: number[];
  onToggle: (id: number) => void;
  playerCost: number;
}) {
  // Agrupar por tier de precio
  const tiers = useMemo(() => {
    const groups: { range: string; teams: TeamForPicker[] }[] = [];
    const sorted = [...teams].sort((a, b) => b.price - a.price);
    let current: { range: string; teams: TeamForPicker[] } | null = null;
    for (const t of sorted) {
      const range =
        t.price >= 40 ? 'Súper favoritos (40-45 M€)'
        : t.price >= 30 ? 'Favoritos (30-35 M€)'
        : t.price >= 15 ? 'Aspirantes (15-25 M€)'
        : t.price >= 6 ? 'Outsiders (6-12 M€)'
        : 'Tapados (2-5 M€)';
      if (!current || current.range !== range) {
        current = { range, teams: [] };
        groups.push(current);
      }
      current.teams.push(t);
    }
    return groups;
  }, [teams]);

  return (
    <div>
      <div className="panini-card p-6 mb-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-display text-3xl text-trophy-100">
              Elige tus 5 selecciones
            </h2>
            <p className="text-pitch-200 text-sm mt-1">
              Llevas {selectedTeamIds.length} de {TEAMS_TO_PICK} elegidas. Puedes
              gastar hasta {MAX_TEAMS_BUDGET}M€ en equipos (se reserva 1M€ para el
              goleador).
            </p>
          </div>
          <p className="font-mono text-xs text-pitch-300">
            {playerCost > 0
              ? <>Goleador: <span className="text-pitch-100">{playerCost}M€</span></>
              : <>Reservado para goleador: <span className="text-pitch-100">{MIN_GOLDEN_BOOT_COST}M€</span></>}
          </p>
        </div>
      </div>

      {tiers.map((tier) => (
        <section key={tier.range} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-display text-trophy-300 text-sm tracking-widest">
              {tier.range}
            </h3>
            <div className="flex-1 h-px bg-pitch-800" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {tier.teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                selected={selectedTeamIds.includes(team.id)}
                disabledForCapacity={
                  !selectedTeamIds.includes(team.id) && selectedTeamIds.length >= TEAMS_TO_PICK
                }
                onClick={() => onToggle(team.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TeamCard({
  team,
  selected,
  disabledForCapacity,
  onClick,
}: {
  team: TeamForPicker;
  selected: boolean;
  disabledForCapacity: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabledForCapacity}
      className={cn(
        'group relative p-3 rounded-sm border text-left transition-all',
        'flex flex-col items-center text-center gap-2',
        selected
          ? 'border-trophy-400 bg-trophy-950/30 shadow-[0_0_0_1px_rgba(216,147,47,0.5)]'
          : 'border-pitch-700 bg-pitch-900 hover:border-pitch-500',
        disabledForCapacity && 'opacity-30 cursor-not-allowed',
      )}
    >
      <span className="text-3xl leading-none" aria-hidden>
        {team.flag}
      </span>
      <span className="font-display text-pitch-50 text-sm leading-tight">
        {team.name}
      </span>
      <span className="flex items-center gap-1.5 mt-1">
        <span className="tag text-[10px]">G.{team.groupCode}</span>
        <span className={cn(
          'font-mono text-xs',
          selected ? 'text-trophy-300' : 'text-pitch-300',
        )}>
          {team.price}M€
        </span>
      </span>
      {selected && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-trophy-400 text-pitch-950 flex items-center justify-center text-xs font-bold">
          ✓
        </span>
      )}
    </button>
  );
}

// ─── PASO 3: BOTA DE ORO ────────────────────────────────────────────────

function Step3({
  players,
  mode,
  selectedPlayerId,
  customName,
  teamsCost,
  onSelectPreset,
  onSelectCustom,
  onChangeCustomName,
}: {
  players: PlayerForPicker[];
  mode: 'preset' | 'custom';
  selectedPlayerId: number | null;
  customName: string;
  teamsCost: number;
  onSelectPreset: (id: number) => void;
  onSelectCustom: () => void;
  onChangeCustomName: (s: string) => void;
}) {
  const tiers = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.price - a.price);
    const groups: { range: string; players: PlayerForPicker[] }[] = [];
    let current: { range: string; players: PlayerForPicker[] } | null = null;
    for (const p of sorted) {
      const range =
        p.price === 10 ? 'Favoritos (10 M€)'
        : p.price === 5 ? 'Segunda línea (5 M€)'
        : 'Resto (2 M€)';
      if (!current || current.range !== range) {
        current = { range, players: [] };
        groups.push(current);
      }
      current.players.push(p);
    }
    return groups;
  }, [players]);

  return (
    <div>
      <div className="panini-card p-6 mb-6">
        <h2 className="font-display text-3xl text-trophy-100">
          Elige tu Bota de Oro
        </h2>
        <p className="text-pitch-200 text-sm mt-1">
          El jugador al que apuestas como máximo goleador del Mundial. 3 puntos
          por cada gol que marque, +4 si gana la Bota de Oro.
        </p>
      </div>

      {tiers.map((tier) => (
        <section key={tier.range} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-display text-trophy-300 text-sm tracking-widest">
              {tier.range}
            </h3>
            <div className="flex-1 h-px bg-pitch-800" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tier.players.map((p) => {
              const cantAfford = teamsCost + p.price > BUDGET;
              const selected = mode === 'preset' && selectedPlayerId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPreset(p.id)}
                  disabled={cantAfford && !selected}
                  className={cn(
                    'group p-4 rounded-sm border text-left transition-all flex items-center gap-3',
                    selected
                      ? 'border-trophy-400 bg-trophy-950/30 shadow-[0_0_0_1px_rgba(216,147,47,0.5)]'
                      : 'border-pitch-700 bg-pitch-900 hover:border-pitch-500',
                    cantAfford && !selected && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <span className="text-2xl shrink-0" aria-hidden>
                    {p.teamFlag ?? '⚽'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display text-pitch-50 text-base leading-tight truncate">
                      {p.name}
                    </span>
                    <span className="block text-xs text-pitch-300 mt-0.5">
                      {p.teamName ?? 'Sin equipo'}
                    </span>
                  </span>
                  <span className={cn(
                    'font-mono text-sm shrink-0',
                    selected ? 'text-trophy-300' : 'text-pitch-300',
                  )}>
                    {p.price}M€
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Opción "Otro" */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h3 className="font-display text-trophy-300 text-sm tracking-widest">
            ¿Tienes una corazonada? (1 M€)
          </h3>
          <div className="flex-1 h-px bg-pitch-800" />
        </div>
        <div
          className={cn(
            'panini-card p-5 transition-colors',
            mode === 'custom' && 'border-trophy-400 shadow-[0_0_0_1px_rgba(216,147,47,0.5)]',
          )}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'custom'}
              onChange={onSelectCustom}
              className="mt-1.5 accent-trophy-400"
            />
            <span className="flex-1">
              <span className="block font-display text-pitch-50 text-lg">
                Otro jugador
              </span>
              <span className="block text-sm text-pitch-300 mt-0.5 mb-3">
                Escribe el nombre del jugador que crees que va a destacar (1M€)
              </span>
              <input
                type="text"
                value={customName}
                onChange={(e) => {
                  onSelectCustom();
                  onChangeCustomName(e.target.value);
                }}
                onFocus={onSelectCustom}
                placeholder="Ej. Pedri, Nico Williams, Florian Wirtz…"
                maxLength={50}
                className="w-full bg-pitch-950 border border-pitch-700 focus:border-trophy-500
                  focus:ring-2 focus:ring-trophy-700/30 outline-none rounded-sm px-4 py-2.5
                  text-pitch-50 placeholder:text-pitch-500 font-display tracking-wide text-base"
              />
            </span>
          </label>
        </div>
      </section>
    </div>
  );
}

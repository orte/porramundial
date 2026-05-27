import type { Match } from '@/db/schema';

type Stage = Match['stage'];
type WinMode = NonNullable<Match['winMode']>;

export const STAGE_LABELS: Record<Stage, string> = {
  group: 'Fase de grupos',
  round_of_32: 'Dieciseisavos',
  round_of_16: 'Octavos',
  quarter_final: 'Cuartos',
  semi_final: 'Semifinal',
  third_place: '3er puesto',
  final: 'Final',
};

export function stageLabel(stage: Stage): string {
  return STAGE_LABELS[stage];
}

export const WIN_MODE_LABELS: Record<WinMode, string> = {
  regulation: '90 min',
  extra_time: 'Prórroga',
  penalties: 'Penaltis',
  draw: 'Empate',
};

export function winModeLabel(mode: WinMode | null): string | null {
  return mode ? WIN_MODE_LABELS[mode] : null;
}

export function isKnockoutStage(stage: Stage): boolean {
  return stage !== 'group';
}

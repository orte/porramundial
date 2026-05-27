export const BUDGET = 100; // millones €
export const TEAMS_TO_PICK = 5;
/**
 * Mínimo que cuesta cualquier candidato a Bota de Oro (la opción "Otro" cuesta
 * 1M€). Reservamos esta cantidad al elegir selecciones para que el usuario
 * siempre pueda completar el Paso 3 — si no, podría gastar los 100M€ enteros
 * en equipos y quedarse sin presupuesto para elegir goleador.
 */
export const MIN_GOLDEN_BOOT_COST = 1;
/** Tope efectivo de gasto en selecciones: 99M€. */
export const MAX_TEAMS_BUDGET = BUDGET - MIN_GOLDEN_BOOT_COST;

export const MIN_PARTICIPANT_NAME = 2;
export const MAX_PARTICIPANT_NAME = 40;
export const MIN_TEAM_NAME = 2;
export const MAX_TEAM_NAME = 40;
export const MAX_CUSTOM_PLAYER_NAME = 50;

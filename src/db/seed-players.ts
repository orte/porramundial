// 20 candidatos a máximo goleador del Mundial 2026 + opción "Otro".
// Precios: top 5 -> 10M€, 6-10 -> 5M€, 11-20 -> 2M€, "Otro" -> 1M€.

export type PlayerSeed = {
  name: string;
  teamCode: string | null; // null para "Otro"
  price: number;
  isCustom?: boolean;
};

export const PLAYERS: PlayerSeed[] = [
  // ─── TOP 5 ─ 10M€ ──────────────────────────────────────────────────
  { name: 'Kylian Mbappé', teamCode: 'FRA', price: 10 },
  { name: 'Harry Kane', teamCode: 'ENG', price: 10 },
  { name: 'Erling Haaland', teamCode: 'NOR', price: 10 },
  { name: 'Lamine Yamal', teamCode: 'ESP', price: 10 },
  { name: 'Vinícius Jr.', teamCode: 'BRA', price: 10 },

  // ─── 6-10 ─ 5M€ ────────────────────────────────────────────────────
  { name: 'Lionel Messi', teamCode: 'ARG', price: 5 },
  { name: 'Julián Álvarez', teamCode: 'ARG', price: 5 },
  { name: 'Mikel Oyarzabal', teamCode: 'ESP', price: 5 },
  { name: 'Ousmane Dembélé', teamCode: 'FRA', price: 5 },
  { name: 'Cristiano Ronaldo', teamCode: 'POR', price: 5 },

  // ─── 11-20 ─ 2M€ ───────────────────────────────────────────────────
  { name: 'Jude Bellingham', teamCode: 'ENG', price: 2 },
  { name: 'Bukayo Saka', teamCode: 'ENG', price: 2 },
  { name: 'Rodrygo', teamCode: 'BRA', price: 2 },
  { name: 'Raphinha', teamCode: 'BRA', price: 2 },
  { name: 'Bruno Fernandes', teamCode: 'POR', price: 2 },
  { name: 'Lautaro Martínez', teamCode: 'ARG', price: 2 },
  { name: 'Florian Wirtz', teamCode: 'GER', price: 2 },
  { name: 'Cody Gakpo', teamCode: 'NED', price: 2 },
  { name: 'Romelu Lukaku', teamCode: 'BEL', price: 2 },
  { name: 'Kai Havertz', teamCode: 'GER', price: 2 },

  // ─── OTRO ─ 1M€ ────────────────────────────────────────────────────
  // Plantilla para clonar y rellenar el nombre cuando el usuario elija "Otro".
  { name: 'Otro (especificar)', teamCode: null, price: 1, isCustom: true },
];

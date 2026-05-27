// Datos de las 48 selecciones del Mundial 2026, con precios basados en las
// cuotas actuales de las casas de apuestas (mayo 2026).
// Total de presupuesto del usuario: 100M€ para 5 selecciones.

export type TeamSeed = {
  name: string;
  code: string;
  flag: string;
  price: number;
  groupCode: string;
};

export const TEAMS: TeamSeed[] = [
  // ─── TIER S ────────────────────────────────────────────────────────
  { name: 'España', code: 'ESP', flag: '🇪🇸', price: 45, groupCode: 'H' },
  { name: 'Francia', code: 'FRA', flag: '🇫🇷', price: 45, groupCode: 'I' },
  { name: 'Inglaterra', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', price: 40, groupCode: 'L' },

  // ─── TIER A ────────────────────────────────────────────────────────
  { name: 'Portugal', code: 'POR', flag: '🇵🇹', price: 35, groupCode: 'K' },
  { name: 'Argentina', code: 'ARG', flag: '🇦🇷', price: 35, groupCode: 'J' },
  { name: 'Brasil', code: 'BRA', flag: '🇧🇷', price: 30, groupCode: 'C' },

  // ─── TIER B ────────────────────────────────────────────────────────
  { name: 'Alemania', code: 'GER', flag: '🇩🇪', price: 25, groupCode: 'E' },
  { name: 'Países Bajos', code: 'NED', flag: '🇳🇱', price: 15, groupCode: 'F' },
  { name: 'Bélgica', code: 'BEL', flag: '🇧🇪', price: 12, groupCode: 'G' },

  // ─── TIER C ────────────────────────────────────────────────────────
  { name: 'Croacia', code: 'CRO', flag: '🇭🇷', price: 10, groupCode: 'L' },
  { name: 'Noruega', code: 'NOR', flag: '🇳🇴', price: 10, groupCode: 'I' },
  { name: 'Uruguay', code: 'URU', flag: '🇺🇾', price: 10, groupCode: 'H' },
  { name: 'Colombia', code: 'COL', flag: '🇨🇴', price: 10, groupCode: 'K' },
  { name: 'Marruecos', code: 'MAR', flag: '🇲🇦', price: 9, groupCode: 'C' },
  { name: 'México', code: 'MEX', flag: '🇲🇽', price: 9, groupCode: 'A' },
  { name: 'Suiza', code: 'SUI', flag: '🇨🇭', price: 8, groupCode: 'B' },

  // ─── TIER C bajo ───────────────────────────────────────────────────
  { name: 'Estados Unidos', code: 'USA', flag: '🇺🇸', price: 8, groupCode: 'D' },
  { name: 'Japón', code: 'JPN', flag: '🇯🇵', price: 7, groupCode: 'F' },
  { name: 'Ecuador', code: 'ECU', flag: '🇪🇨', price: 7, groupCode: 'E' },
  { name: 'Senegal', code: 'SEN', flag: '🇸🇳', price: 7, groupCode: 'I' },

  // ─── TIER D ────────────────────────────────────────────────────────
  { name: 'Austria', code: 'AUT', flag: '🇦🇹', price: 5, groupCode: 'J' },
  { name: 'Suecia', code: 'SWE', flag: '🇸🇪', price: 5, groupCode: 'F' },
  { name: 'Egipto', code: 'EGY', flag: '🇪🇬', price: 5, groupCode: 'G' },
  { name: 'Canadá', code: 'CAN', flag: '🇨🇦', price: 5, groupCode: 'B' },
  { name: 'Turquía', code: 'TUR', flag: '🇹🇷', price: 5, groupCode: 'D' },
  { name: 'Costa de Marfil', code: 'CIV', flag: '🇨🇮', price: 4, groupCode: 'E' },
  { name: 'Australia', code: 'AUS', flag: '🇦🇺', price: 4, groupCode: 'D' },
  { name: 'Corea del Sur', code: 'KOR', flag: '🇰🇷', price: 4, groupCode: 'A' },
  { name: 'Paraguay', code: 'PAR', flag: '🇵🇾', price: 4, groupCode: 'D' },
  { name: 'Ghana', code: 'GHA', flag: '🇬🇭', price: 4, groupCode: 'L' },
  { name: 'Escocia', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', price: 4, groupCode: 'C' },
  { name: 'Panamá', code: 'PAN', flag: '🇵🇦', price: 3, groupCode: 'L' },
  { name: 'República Checa', code: 'CZE', flag: '🇨🇿', price: 3, groupCode: 'A' },
  { name: 'Túnez', code: 'TUN', flag: '🇹🇳', price: 3, groupCode: 'F' },
  { name: 'Argelia', code: 'ALG', flag: '🇩🇿', price: 3, groupCode: 'J' },
  { name: 'Nueva Zelanda', code: 'NZL', flag: '🇳🇿', price: 3, groupCode: 'G' },
  { name: 'Cabo Verde', code: 'CPV', flag: '🇨🇻', price: 3, groupCode: 'H' },
  { name: 'Uzbekistán', code: 'UZB', flag: '🇺🇿', price: 3, groupCode: 'K' },
  { name: 'Jordania', code: 'JOR', flag: '🇯🇴', price: 3, groupCode: 'J' },
  { name: 'Irán', code: 'IRN', flag: '🇮🇷', price: 3, groupCode: 'G' },
  { name: 'Catar', code: 'QAT', flag: '🇶🇦', price: 3, groupCode: 'B' },
  { name: 'Arabia Saudita', code: 'KSA', flag: '🇸🇦', price: 3, groupCode: 'H' },
  { name: 'Bosnia y Herzegovina', code: 'BIH', flag: '🇧🇦', price: 2, groupCode: 'B' },
  { name: 'Irak', code: 'IRQ', flag: '🇮🇶', price: 2, groupCode: 'I' },
  { name: 'RD Congo', code: 'COD', flag: '🇨🇩', price: 2, groupCode: 'K' },
  { name: 'Curazao', code: 'CUW', flag: '🇨🇼', price: 2, groupCode: 'E' },
  { name: 'Haití', code: 'HAI', flag: '🇭🇹', price: 2, groupCode: 'C' },
  { name: 'Sudáfrica', code: 'RSA', flag: '🇿🇦', price: 2, groupCode: 'A' },
];

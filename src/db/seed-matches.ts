// Calendario completo del Mundial 2026 (104 partidos).
// Las fechas y horas vienen del calendario oficial. Las horas se convierten
// a UTC para almacenarse en Postgres.

export type MatchSeed = {
  matchNumber: number;
  stage:
    | 'group'
    | 'round_of_32'
    | 'round_of_16'
    | 'quarter_final'
    | 'semi_final'
    | 'third_place'
    | 'final';
  groupCode?: string;
  homeTeamCode?: string;
  awayTeamCode?: string;
  homePlaceholder?: string; // ej. "1A" o "Ganador 73"
  awayPlaceholder?: string;
  kickoffISO?: string; // ISO UTC
  venue?: string;
};

// Helper: zona horaria local de un partido -> UTC.
// Lo dejo como string ISO para simplicidad; la fila se almacena como timestamptz.

export const MATCHES: MatchSeed[] = [
  // ═══════════════════════════════════════════════════════════════════
  //                      FASE DE GRUPOS — JORNADA 1
  // ═══════════════════════════════════════════════════════════════════

  // Jueves 11 junio
  {
    matchNumber: 1,
    stage: 'group',
    groupCode: 'A',
    homeTeamCode: 'MEX',
    awayTeamCode: 'RSA',
    kickoffISO: '2026-06-11T19:00:00Z', // 13:00 CDMX (UTC-6)
    venue: 'Estadio Azteca',
  },
  {
    matchNumber: 2,
    stage: 'group',
    groupCode: 'A',
    homeTeamCode: 'KOR',
    awayTeamCode: 'CZE',
    kickoffISO: '2026-06-12T02:00:00Z', // 20:00 CDMX (UTC-6)
    venue: 'Estadio Chivas',
  },

  // Viernes 12 junio
  {
    matchNumber: 3,
    stage: 'group',
    groupCode: 'B',
    homeTeamCode: 'CAN',
    awayTeamCode: 'BIH',
    kickoffISO: '2026-06-12T19:00:00Z', // 15:00 ET (UTC-4)
    venue: 'Estadio Nacional de Canadá',
  },
  {
    matchNumber: 4,
    stage: 'group',
    groupCode: 'D',
    homeTeamCode: 'USA',
    awayTeamCode: 'PAR',
    kickoffISO: '2026-06-13T01:00:00Z', // 18:00 PT (UTC-7)
    venue: 'SoFi Stadium',
  },

  // Sábado 13 junio
  {
    matchNumber: 5,
    stage: 'group',
    groupCode: 'C',
    homeTeamCode: 'HAI',
    awayTeamCode: 'SCO',
    kickoffISO: '2026-06-14T01:00:00Z', // 21:00 ET (UTC-4)
    venue: 'MetLife Stadium',
  },
  {
    matchNumber: 6,
    stage: 'group',
    groupCode: 'D',
    homeTeamCode: 'AUS',
    awayTeamCode: 'TUR',
    kickoffISO: '2026-06-14T04:00:00Z', // 21:00 PT (UTC-7)
    venue: 'Estadio BC Place',
  },
  {
    matchNumber: 7,
    stage: 'group',
    groupCode: 'C',
    homeTeamCode: 'BRA',
    awayTeamCode: 'MAR',
    kickoffISO: '2026-06-13T22:00:00Z', // 18:00 ET (UTC-4)
    venue: 'Gillette Stadium',
  },
  {
    matchNumber: 8,
    stage: 'group',
    groupCode: 'B',
    homeTeamCode: 'QAT',
    awayTeamCode: 'SUI',
    kickoffISO: '2026-06-13T19:00:00Z', // 12:00 PT (UTC-7)
    venue: "Levi's Stadium",
  },

  // Domingo 14 junio
  {
    matchNumber: 9,
    stage: 'group',
    groupCode: 'E',
    homeTeamCode: 'CIV',
    awayTeamCode: 'ECU',
    kickoffISO: '2026-06-14T23:00:00Z', // 19:00 ET (UTC-4)
    venue: 'Lincoln Financial Field',
  },
  {
    matchNumber: 10,
    stage: 'group',
    groupCode: 'E',
    homeTeamCode: 'GER',
    awayTeamCode: 'CUW',
    kickoffISO: '2026-06-14T17:00:00Z', // 12:00 CT (UTC-5)
    venue: 'NRG Stadium',
  },
  {
    matchNumber: 11,
    stage: 'group',
    groupCode: 'F',
    homeTeamCode: 'NED',
    awayTeamCode: 'JPN',
    kickoffISO: '2026-06-14T20:00:00Z', // 15:00 CT (UTC-5)
    venue: 'AT&T Stadium',
  },
  {
    matchNumber: 12,
    stage: 'group',
    groupCode: 'F',
    homeTeamCode: 'SWE',
    awayTeamCode: 'TUN',
    kickoffISO: '2026-06-15T02:00:00Z', // 20:00 CDMX (UTC-6)
    venue: 'Estadio Monterrey',
  },

  // Lunes 15 junio
  {
    matchNumber: 13,
    stage: 'group',
    groupCode: 'H',
    homeTeamCode: 'KSA',
    awayTeamCode: 'URU',
    kickoffISO: '2026-06-15T22:00:00Z', // 18:00 ET (UTC-4)
    venue: 'Hard Rock Stadium',
  },
  {
    matchNumber: 14,
    stage: 'group',
    groupCode: 'H',
    homeTeamCode: 'ESP',
    awayTeamCode: 'CPV',
    kickoffISO: '2026-06-15T16:00:00Z', // 12:00 ET (UTC-4)
    venue: 'Mercedes-Benz Stadium',
  },
  {
    matchNumber: 15,
    stage: 'group',
    groupCode: 'G',
    homeTeamCode: 'IRN',
    awayTeamCode: 'NZL',
    kickoffISO: '2026-06-16T01:00:00Z', // 18:00 PT (UTC-7)
    venue: 'Lumen Field',
  },
  {
    matchNumber: 16,
    stage: 'group',
    groupCode: 'G',
    homeTeamCode: 'BEL',
    awayTeamCode: 'EGY',
    kickoffISO: '2026-06-15T19:00:00Z', // 12:00 PT (UTC-7)
    venue: 'SoFi Stadium',
  },

  // Martes 16 junio
  {
    matchNumber: 17,
    stage: 'group',
    groupCode: 'I',
    homeTeamCode: 'FRA',
    awayTeamCode: 'SEN',
    kickoffISO: '2026-06-16T19:00:00Z', // 15:00 ET (UTC-4)
    venue: 'MetLife Stadium',
  },
  {
    matchNumber: 18,
    stage: 'group',
    groupCode: 'I',
    homeTeamCode: 'IRQ',
    awayTeamCode: 'NOR',
    kickoffISO: '2026-06-16T22:00:00Z', // 18:00 ET (UTC-4)
    venue: 'Gillette Stadium',
  },
  {
    matchNumber: 19,
    stage: 'group',
    groupCode: 'J',
    homeTeamCode: 'ARG',
    awayTeamCode: 'ALG',
    kickoffISO: '2026-06-17T01:00:00Z', // 20:00 CT (UTC-5)
    venue: 'Arrowhead Stadium',
  },
  {
    matchNumber: 20,
    stage: 'group',
    groupCode: 'J',
    homeTeamCode: 'AUT',
    awayTeamCode: 'JOR',
    kickoffISO: '2026-06-17T04:00:00Z', // 21:00 PT (UTC-7)
    venue: "Levi's Stadium",
  },

  // Miércoles 17 junio
  {
    matchNumber: 21,
    stage: 'group',
    groupCode: 'L',
    homeTeamCode: 'GHA',
    awayTeamCode: 'PAN',
    kickoffISO: '2026-06-18T00:00:00Z', // 19:00 CT (UTC-5)
    venue: 'AT&T Stadium',
  },
  {
    matchNumber: 22,
    stage: 'group',
    groupCode: 'L',
    homeTeamCode: 'ENG',
    awayTeamCode: 'CRO',
    kickoffISO: '2026-06-17T19:00:00Z', // 15:00 ET (UTC-4)
    venue: 'Estadio Nacional de Canadá',
  },
  {
    matchNumber: 23,
    stage: 'group',
    groupCode: 'K',
    homeTeamCode: 'POR',
    awayTeamCode: 'COD',
    kickoffISO: '2026-06-17T17:00:00Z', // 12:00 CT (UTC-5)
    venue: 'NRG Stadium',
  },
  {
    matchNumber: 24,
    stage: 'group',
    groupCode: 'K',
    homeTeamCode: 'UZB',
    awayTeamCode: 'COL',
    kickoffISO: '2026-06-18T02:00:00Z', // 20:00 CDMX (UTC-6)
    venue: 'Estadio Azteca',
  },

  // ═══════════════════════════════════════════════════════════════════
  //                      FASE DE GRUPOS — JORNADA 2
  // ═══════════════════════════════════════════════════════════════════

  // Jueves 18 junio
  {
    matchNumber: 25,
    stage: 'group',
    groupCode: 'A',
    homeTeamCode: 'CZE',
    awayTeamCode: 'RSA',
    kickoffISO: '2026-06-18T16:00:00Z',
    venue: 'Mercedes-Benz Stadium',
  },
  {
    matchNumber: 26,
    stage: 'group',
    groupCode: 'B',
    homeTeamCode: 'SUI',
    awayTeamCode: 'BIH',
    kickoffISO: '2026-06-18T19:00:00Z',
    venue: 'SoFi Stadium',
  },
  {
    matchNumber: 27,
    stage: 'group',
    groupCode: 'B',
    homeTeamCode: 'CAN',
    awayTeamCode: 'QAT',
    kickoffISO: '2026-06-18T22:00:00Z',
    venue: 'Estadio BC Place',
  },
  {
    matchNumber: 28,
    stage: 'group',
    groupCode: 'A',
    homeTeamCode: 'MEX',
    awayTeamCode: 'KOR',
    kickoffISO: '2026-06-19T01:00:00Z',
    venue: 'Estadio Chivas',
  },

  // Viernes 19 junio
  {
    matchNumber: 29,
    stage: 'group',
    groupCode: 'C',
    homeTeamCode: 'BRA',
    awayTeamCode: 'HAI',
    kickoffISO: '2026-06-20T01:00:00Z',
    venue: 'Lincoln Financial Field',
  },
  {
    matchNumber: 30,
    stage: 'group',
    groupCode: 'C',
    homeTeamCode: 'SCO',
    awayTeamCode: 'MAR',
    kickoffISO: '2026-06-19T22:00:00Z',
    venue: 'Gillette Stadium',
  },
  {
    matchNumber: 31,
    stage: 'group',
    groupCode: 'D',
    homeTeamCode: 'TUR',
    awayTeamCode: 'PAR',
    kickoffISO: '2026-06-20T04:00:00Z',
    venue: "Levi's Stadium",
  },
  {
    matchNumber: 32,
    stage: 'group',
    groupCode: 'D',
    homeTeamCode: 'USA',
    awayTeamCode: 'AUS',
    kickoffISO: '2026-06-19T19:00:00Z',
    venue: 'Lumen Field',
  },

  // Sábado 20 junio
  {
    matchNumber: 33,
    stage: 'group',
    groupCode: 'E',
    homeTeamCode: 'GER',
    awayTeamCode: 'CIV',
    kickoffISO: '2026-06-20T20:00:00Z',
    venue: 'Estadio Nacional de Canadá',
  },
  {
    matchNumber: 34,
    stage: 'group',
    groupCode: 'E',
    homeTeamCode: 'ECU',
    awayTeamCode: 'CUW',
    kickoffISO: '2026-06-21T00:00:00Z',
    venue: 'Arrowhead Stadium',
  },
  {
    matchNumber: 35,
    stage: 'group',
    groupCode: 'F',
    homeTeamCode: 'NED',
    awayTeamCode: 'SWE',
    kickoffISO: '2026-06-20T17:00:00Z',
    venue: 'NRG Stadium',
  },
  {
    matchNumber: 36,
    stage: 'group',
    groupCode: 'F',
    homeTeamCode: 'TUN',
    awayTeamCode: 'JPN',
    kickoffISO: '2026-06-21T04:00:00Z',
    venue: 'Estadio Monterrey',
  },

  // Domingo 21 junio
  {
    matchNumber: 37,
    stage: 'group',
    groupCode: 'H',
    homeTeamCode: 'URU',
    awayTeamCode: 'CPV',
    kickoffISO: '2026-06-21T22:00:00Z',
    venue: 'Mercedes-Benz Stadium',
  },
  {
    matchNumber: 38,
    stage: 'group',
    groupCode: 'H',
    homeTeamCode: 'ESP',
    awayTeamCode: 'KSA',
    kickoffISO: '2026-06-21T16:00:00Z',
    venue: 'Hard Rock Stadium',
  },
  {
    matchNumber: 39,
    stage: 'group',
    groupCode: 'G',
    homeTeamCode: 'BEL',
    awayTeamCode: 'IRN',
    kickoffISO: '2026-06-21T19:00:00Z',
    venue: 'SoFi Stadium',
  },
  {
    matchNumber: 40,
    stage: 'group',
    groupCode: 'G',
    homeTeamCode: 'NZL',
    awayTeamCode: 'EGY',
    kickoffISO: '2026-06-22T01:00:00Z',
    venue: 'Estadio BC Place',
  },

  // Lunes 22 junio
  {
    matchNumber: 41,
    stage: 'group',
    groupCode: 'I',
    homeTeamCode: 'NOR',
    awayTeamCode: 'SEN',
    kickoffISO: '2026-06-23T00:00:00Z',
    venue: 'Lincoln Financial Field',
  },
  {
    matchNumber: 42,
    stage: 'group',
    groupCode: 'I',
    homeTeamCode: 'FRA',
    awayTeamCode: 'IRQ',
    kickoffISO: '2026-06-22T21:00:00Z',
    venue: 'MetLife Stadium',
  },
  {
    matchNumber: 43,
    stage: 'group',
    groupCode: 'J',
    homeTeamCode: 'ARG',
    awayTeamCode: 'AUT',
    kickoffISO: '2026-06-22T17:00:00Z',
    venue: 'AT&T Stadium',
  },
  {
    matchNumber: 44,
    stage: 'group',
    groupCode: 'J',
    homeTeamCode: 'JOR',
    awayTeamCode: 'ALG',
    kickoffISO: '2026-06-23T03:00:00Z',
    venue: "Levi's Stadium",
  },

  // Martes 23 junio
  {
    matchNumber: 45,
    stage: 'group',
    groupCode: 'L',
    homeTeamCode: 'ENG',
    awayTeamCode: 'GHA',
    kickoffISO: '2026-06-23T20:00:00Z',
    venue: 'Gillette Stadium',
  },
  {
    matchNumber: 46,
    stage: 'group',
    groupCode: 'L',
    homeTeamCode: 'PAN',
    awayTeamCode: 'CRO',
    kickoffISO: '2026-06-23T23:00:00Z',
    venue: 'Estadio Nacional de Canadá',
  },
  {
    matchNumber: 47,
    stage: 'group',
    groupCode: 'K',
    homeTeamCode: 'POR',
    awayTeamCode: 'UZB',
    kickoffISO: '2026-06-23T17:00:00Z',
    venue: 'NRG Stadium',
  },
  {
    matchNumber: 48,
    stage: 'group',
    groupCode: 'K',
    homeTeamCode: 'COL',
    awayTeamCode: 'COD',
    kickoffISO: '2026-06-24T02:00:00Z',
    venue: 'Estadio Chivas',
  },

  // ═══════════════════════════════════════════════════════════════════
  //                      FASE DE GRUPOS — JORNADA 3
  // ═══════════════════════════════════════════════════════════════════

  // Miércoles 24 junio
  {
    matchNumber: 49,
    stage: 'group',
    groupCode: 'C',
    homeTeamCode: 'SCO',
    awayTeamCode: 'BRA',
    kickoffISO: '2026-06-24T22:00:00Z',
    venue: 'Hard Rock Stadium',
  },
  {
    matchNumber: 50,
    stage: 'group',
    groupCode: 'C',
    homeTeamCode: 'MAR',
    awayTeamCode: 'HAI',
    kickoffISO: '2026-06-24T22:00:00Z',
    venue: 'Mercedes-Benz Stadium',
  },
  {
    matchNumber: 51,
    stage: 'group',
    groupCode: 'B',
    homeTeamCode: 'SUI',
    awayTeamCode: 'CAN',
    kickoffISO: '2026-06-24T19:00:00Z',
    venue: 'Estadio BC Place',
  },
  {
    matchNumber: 52,
    stage: 'group',
    groupCode: 'B',
    homeTeamCode: 'BIH',
    awayTeamCode: 'QAT',
    kickoffISO: '2026-06-24T19:00:00Z',
    venue: 'Lumen Field',
  },
  {
    matchNumber: 53,
    stage: 'group',
    groupCode: 'A',
    homeTeamCode: 'CZE',
    awayTeamCode: 'MEX',
    kickoffISO: '2026-06-25T01:00:00Z',
    venue: 'Estadio Azteca',
  },
  {
    matchNumber: 54,
    stage: 'group',
    groupCode: 'A',
    homeTeamCode: 'RSA',
    awayTeamCode: 'KOR',
    kickoffISO: '2026-06-25T01:00:00Z',
    venue: 'Estadio Monterrey',
  },

  // Jueves 25 junio
  {
    matchNumber: 55,
    stage: 'group',
    groupCode: 'E',
    homeTeamCode: 'CUW',
    awayTeamCode: 'CIV',
    kickoffISO: '2026-06-25T20:00:00Z',
    venue: 'Lincoln Financial Field',
  },
  {
    matchNumber: 56,
    stage: 'group',
    groupCode: 'E',
    homeTeamCode: 'ECU',
    awayTeamCode: 'GER',
    kickoffISO: '2026-06-25T20:00:00Z',
    venue: 'MetLife Stadium',
  },
  {
    matchNumber: 57,
    stage: 'group',
    groupCode: 'F',
    homeTeamCode: 'JPN',
    awayTeamCode: 'SWE',
    kickoffISO: '2026-06-25T23:00:00Z',
    venue: 'AT&T Stadium',
  },
  {
    matchNumber: 58,
    stage: 'group',
    groupCode: 'F',
    homeTeamCode: 'TUN',
    awayTeamCode: 'NED',
    kickoffISO: '2026-06-25T23:00:00Z',
    venue: 'Arrowhead Stadium',
  },
  {
    matchNumber: 59,
    stage: 'group',
    groupCode: 'D',
    homeTeamCode: 'TUR',
    awayTeamCode: 'USA',
    kickoffISO: '2026-06-26T02:00:00Z',
    venue: 'SoFi Stadium',
  },
  {
    matchNumber: 60,
    stage: 'group',
    groupCode: 'D',
    homeTeamCode: 'PAR',
    awayTeamCode: 'AUS',
    kickoffISO: '2026-06-26T02:00:00Z',
    venue: "Levi's Stadium",
  },

  // Viernes 26 junio
  {
    matchNumber: 61,
    stage: 'group',
    groupCode: 'I',
    homeTeamCode: 'NOR',
    awayTeamCode: 'FRA',
    kickoffISO: '2026-06-26T19:00:00Z',
    venue: 'Gillette Stadium',
  },
  {
    matchNumber: 62,
    stage: 'group',
    groupCode: 'I',
    homeTeamCode: 'SEN',
    awayTeamCode: 'IRQ',
    kickoffISO: '2026-06-26T19:00:00Z',
    venue: 'Estadio Nacional de Canadá',
  },
  {
    matchNumber: 63,
    stage: 'group',
    groupCode: 'G',
    homeTeamCode: 'EGY',
    awayTeamCode: 'IRN',
    kickoffISO: '2026-06-27T03:00:00Z',
    venue: 'Lumen Field',
  },
  {
    matchNumber: 64,
    stage: 'group',
    groupCode: 'G',
    homeTeamCode: 'NZL',
    awayTeamCode: 'BEL',
    kickoffISO: '2026-06-27T03:00:00Z',
    venue: 'Estadio BC Place',
  },
  {
    matchNumber: 65,
    stage: 'group',
    groupCode: 'H',
    homeTeamCode: 'CPV',
    awayTeamCode: 'KSA',
    kickoffISO: '2026-06-27T00:00:00Z',
    venue: 'NRG Stadium',
  },
  {
    matchNumber: 66,
    stage: 'group',
    groupCode: 'H',
    homeTeamCode: 'URU',
    awayTeamCode: 'ESP',
    kickoffISO: '2026-06-27T00:00:00Z',
    venue: 'Estadio Akron',
  },

  // Sábado 27 junio
  {
    matchNumber: 67,
    stage: 'group',
    groupCode: 'L',
    homeTeamCode: 'PAN',
    awayTeamCode: 'ENG',
    kickoffISO: '2026-06-27T21:00:00Z',
    venue: 'MetLife Stadium',
  },
  {
    matchNumber: 68,
    stage: 'group',
    groupCode: 'L',
    homeTeamCode: 'CRO',
    awayTeamCode: 'GHA',
    kickoffISO: '2026-06-27T21:00:00Z',
    venue: 'Lincoln Financial Field',
  },
  {
    matchNumber: 69,
    stage: 'group',
    groupCode: 'J',
    homeTeamCode: 'ALG',
    awayTeamCode: 'AUT',
    kickoffISO: '2026-06-28T02:00:00Z',
    venue: 'Arrowhead Stadium',
  },
  {
    matchNumber: 70,
    stage: 'group',
    groupCode: 'J',
    homeTeamCode: 'JOR',
    awayTeamCode: 'ARG',
    kickoffISO: '2026-06-28T02:00:00Z',
    venue: 'AT&T Stadium',
  },
  {
    matchNumber: 71,
    stage: 'group',
    groupCode: 'K',
    homeTeamCode: 'COL',
    awayTeamCode: 'POR',
    kickoffISO: '2026-06-27T23:30:00Z',
    venue: 'Hard Rock Stadium',
  },
  {
    matchNumber: 72,
    stage: 'group',
    groupCode: 'K',
    homeTeamCode: 'COD',
    awayTeamCode: 'UZB',
    kickoffISO: '2026-06-27T23:30:00Z',
    venue: 'Mercedes-Benz Stadium',
  },

  // ═══════════════════════════════════════════════════════════════════
  //                       DIECISEISAVOS DE FINAL (32→16)
  // ═══════════════════════════════════════════════════════════════════
  // Los placeholders se rellenarán desde el panel admin cuando acabe la
  // fase de grupos. Solo guardamos fecha, sede y número de partido.

  {
    matchNumber: 73,
    stage: 'round_of_32',
    homePlaceholder: '1A',
    awayPlaceholder: '2C',
    kickoffISO: '2026-06-28T19:00:00Z',
    venue: 'SoFi Stadium',
  },
  {
    matchNumber: 74,
    stage: 'round_of_32',
    homePlaceholder: '1C',
    awayPlaceholder: '2F',
    kickoffISO: '2026-06-29T20:30:00Z',
    venue: 'Gillette Stadium',
  },
  {
    matchNumber: 75,
    stage: 'round_of_32',
    homePlaceholder: '1B',
    awayPlaceholder: '3A/B/F',
    kickoffISO: '2026-06-30T01:00:00Z',
    venue: 'Estadio Monterrey',
  },
  {
    matchNumber: 76,
    stage: 'round_of_32',
    homePlaceholder: '2B',
    awayPlaceholder: '2A',
    kickoffISO: '2026-06-29T17:00:00Z',
    venue: 'NRG Stadium',
  },
  {
    matchNumber: 77,
    stage: 'round_of_32',
    homePlaceholder: '1F',
    awayPlaceholder: '3C/D/E',
    kickoffISO: '2026-06-30T21:00:00Z',
    venue: 'MetLife Stadium',
  },
  {
    matchNumber: 78,
    stage: 'round_of_32',
    homePlaceholder: '1D',
    awayPlaceholder: '3B/E/F',
    kickoffISO: '2026-06-30T17:00:00Z',
    venue: 'AT&T Stadium',
  },
  {
    matchNumber: 79,
    stage: 'round_of_32',
    homePlaceholder: '1E',
    awayPlaceholder: '2D',
    kickoffISO: '2026-07-01T01:00:00Z',
    venue: 'Estadio Azteca',
  },
  {
    matchNumber: 80,
    stage: 'round_of_32',
    homePlaceholder: '1G',
    awayPlaceholder: '3A/E/H/I',
    kickoffISO: '2026-07-01T16:00:00Z',
    venue: 'Mercedes-Benz Stadium',
  },
  {
    matchNumber: 81,
    stage: 'round_of_32',
    homePlaceholder: '2E',
    awayPlaceholder: '2G',
    kickoffISO: '2026-07-02T00:00:00Z',
    venue: "Levi's Stadium",
  },
  {
    matchNumber: 82,
    stage: 'round_of_32',
    homePlaceholder: '1H',
    awayPlaceholder: '3C/G/H/J',
    kickoffISO: '2026-07-01T20:00:00Z',
    venue: 'Lumen Field',
  },
  {
    matchNumber: 83,
    stage: 'round_of_32',
    homePlaceholder: '1I',
    awayPlaceholder: '3D/G/H/I',
    kickoffISO: '2026-07-02T23:00:00Z',
    venue: 'Estadio Nacional de Canadá',
  },
  {
    matchNumber: 84,
    stage: 'round_of_32',
    homePlaceholder: '2H',
    awayPlaceholder: '2I',
    kickoffISO: '2026-07-02T19:00:00Z',
    venue: 'SoFi Stadium',
  },
  {
    matchNumber: 85,
    stage: 'round_of_32',
    homePlaceholder: '1J',
    awayPlaceholder: '2L',
    kickoffISO: '2026-07-03T03:00:00Z',
    venue: 'Estadio BC Place',
  },
  {
    matchNumber: 86,
    stage: 'round_of_32',
    homePlaceholder: '1K',
    awayPlaceholder: '3E/H/I/J',
    kickoffISO: '2026-07-03T22:00:00Z',
    venue: 'Hard Rock Stadium',
  },
  {
    matchNumber: 87,
    stage: 'round_of_32',
    homePlaceholder: '2J',
    awayPlaceholder: '2K',
    kickoffISO: '2026-07-04T01:30:00Z',
    venue: 'Arrowhead Stadium',
  },
  {
    matchNumber: 88,
    stage: 'round_of_32',
    homePlaceholder: '1L',
    awayPlaceholder: '3F/I/J/K',
    kickoffISO: '2026-07-03T18:00:00Z',
    venue: 'AT&T Stadium',
  },

  // ═══════════════════════════════════════════════════════════════════
  //                       OCTAVOS DE FINAL (16→8)
  // ═══════════════════════════════════════════════════════════════════
  {
    matchNumber: 89,
    stage: 'round_of_16',
    homePlaceholder: 'Ganador 73',
    awayPlaceholder: 'Ganador 74',
    kickoffISO: '2026-07-04T21:00:00Z',
    venue: 'Lincoln Financial Field',
  },
  {
    matchNumber: 90,
    stage: 'round_of_16',
    homePlaceholder: 'Ganador 75',
    awayPlaceholder: 'Ganador 76',
    kickoffISO: '2026-07-05T17:00:00Z',
    venue: 'NRG Stadium',
  },
  {
    matchNumber: 91,
    stage: 'round_of_16',
    homePlaceholder: 'Ganador 77',
    awayPlaceholder: 'Ganador 78',
    kickoffISO: '2026-07-05T20:00:00Z',
    venue: 'MetLife Stadium',
  },
  {
    matchNumber: 92,
    stage: 'round_of_16',
    homePlaceholder: 'Ganador 79',
    awayPlaceholder: 'Ganador 80',
    kickoffISO: '2026-07-06T00:00:00Z',
    venue: 'Estadio Azteca',
  },
  {
    matchNumber: 93,
    stage: 'round_of_16',
    homePlaceholder: 'Ganador 81',
    awayPlaceholder: 'Ganador 82',
    kickoffISO: '2026-07-06T19:00:00Z',
    venue: 'AT&T Stadium',
  },
  {
    matchNumber: 94,
    stage: 'round_of_16',
    homePlaceholder: 'Ganador 83',
    awayPlaceholder: 'Ganador 84',
    kickoffISO: '2026-07-07T00:00:00Z',
    venue: 'Lumen Field',
  },
  {
    matchNumber: 95,
    stage: 'round_of_16',
    homePlaceholder: 'Ganador 85',
    awayPlaceholder: 'Ganador 86',
    kickoffISO: '2026-07-07T16:00:00Z',
    venue: 'Mercedes-Benz Stadium',
  },
  {
    matchNumber: 96,
    stage: 'round_of_16',
    homePlaceholder: 'Ganador 87',
    awayPlaceholder: 'Ganador 88',
    kickoffISO: '2026-07-07T20:00:00Z',
    venue: 'Estadio BC Place',
  },

  // ═══════════════════════════════════════════════════════════════════
  //                       CUARTOS DE FINAL (8→4)
  // ═══════════════════════════════════════════════════════════════════
  {
    matchNumber: 97,
    stage: 'quarter_final',
    homePlaceholder: 'Ganador 89',
    awayPlaceholder: 'Ganador 90',
    kickoffISO: '2026-07-09T20:00:00Z',
    venue: 'Gillette Stadium',
  },
  {
    matchNumber: 98,
    stage: 'quarter_final',
    homePlaceholder: 'Ganador 91',
    awayPlaceholder: 'Ganador 92',
    kickoffISO: '2026-07-10T19:00:00Z',
    venue: 'SoFi Stadium',
  },
  {
    matchNumber: 99,
    stage: 'quarter_final',
    homePlaceholder: 'Ganador 93',
    awayPlaceholder: 'Ganador 94',
    kickoffISO: '2026-07-11T21:00:00Z',
    venue: 'Hard Rock Stadium',
  },
  {
    matchNumber: 100,
    stage: 'quarter_final',
    homePlaceholder: 'Ganador 95',
    awayPlaceholder: 'Ganador 96',
    kickoffISO: '2026-07-12T01:00:00Z',
    venue: 'Arrowhead Stadium',
  },

  // ═══════════════════════════════════════════════════════════════════
  //                       SEMIFINALES (4→2)
  // ═══════════════════════════════════════════════════════════════════
  {
    matchNumber: 101,
    stage: 'semi_final',
    homePlaceholder: 'Ganador 97',
    awayPlaceholder: 'Ganador 98',
    kickoffISO: '2026-07-14T19:00:00Z',
    venue: 'AT&T Stadium',
  },
  {
    matchNumber: 102,
    stage: 'semi_final',
    homePlaceholder: 'Ganador 99',
    awayPlaceholder: 'Ganador 100',
    kickoffISO: '2026-07-15T19:00:00Z',
    venue: 'Mercedes-Benz Stadium',
  },

  // ═══════════════════════════════════════════════════════════════════
  //                       TERCER PUESTO
  // ═══════════════════════════════════════════════════════════════════
  {
    matchNumber: 103,
    stage: 'third_place',
    homePlaceholder: 'Perdedor 101',
    awayPlaceholder: 'Perdedor 102',
    kickoffISO: '2026-07-18T21:00:00Z',
    venue: 'Hard Rock Stadium',
  },

  // ═══════════════════════════════════════════════════════════════════
  //                       FINAL
  // ═══════════════════════════════════════════════════════════════════
  {
    matchNumber: 104,
    stage: 'final',
    homePlaceholder: 'Ganador 101',
    awayPlaceholder: 'Ganador 102',
    kickoffISO: '2026-07-19T17:00:00Z',
    venue: 'MetLife Stadium',
  },
];

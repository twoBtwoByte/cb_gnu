/**
 * worldCupConfig.js
 *
 * Static configuration for the FIFA World Cup 2026 probability tracker.
 *
 * Exports:
 *   MATCH_CONFIGS – match metadata and bracket definitions, keyed by match number.
 *   TEAM_DATA     – the full list of 48 teams with group, flag and confederation.
 *
 * These two datasets are intentionally kept separate from the service logic so
 * they can be updated (e.g. when draw results are confirmed) without touching
 * any computation or API code.
 */

// ---------------------------------------------------------------------------
// Match configurations
//
// MATCH_CONFIGS is a map from match number to a configuration object that
// includes match metadata (venue, date, stage, etc.) and a bracket definition.
//
// Each bracket has one or more slots. Each slot describes the two sides of a
// Round-of-32 game whose winner advances to the target match:
//
//   sideA – a group that qualifies by finishing in a specific position (e.g.
//           1st place in Group B).
//   sideB – either another specific group qualifier, or a best-3rd-place pool
//           drawn from a set of eligible groups.
//
// Probabilities for each path are computed at run-time via
// computeProbabilityForMatch(), so bracket changes automatically propagate to
// all displayed figures.
//
// To support a new match, add an entry here with the appropriate bracket
// structure; no changes to the service layer are required.
// ---------------------------------------------------------------------------

export const MATCH_CONFIGS = {
  73: {
    matchNumber: 73,
    stage: "Round of 32",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    country: "USA",
    scheduledDate: "June 28, 2026",
    description: "FIFA World Cup 2026 – Match 73 (Round of 32) at Los Angeles Stadium, Los Angeles",
    bracket: {
      slot1: {
        label: "2A",
      },
      slot2: {
        label: "2B",
      },
    },
  },
  74: {
    matchNumber: 74,
    stage: "Round of 32",
    venue: "Boston Stadium",
    city: "Boston",
    country: "USA",
    scheduledDate: "June 29, 2026",
    description: "FIFA World Cup 2026 – Match 74 (Round of 32) at Boston Stadium, Boston",
    bracket: {
      slot1: {
        label: "1E",
      },
      slot2: {
        label: "3rd Place",
      },
    },
  },
  75: {
    matchNumber: 75,
    stage: "Round of 32",
    venue: "Estadio Monterrey",
    city: "Monterrey",
    country: "Mexico",
    scheduledDate: "June 29, 2026",
    description: "FIFA World Cup 2026 – Match 75 (Round of 32) at Estadio Monterrey, Monterrey",
    bracket: {
      slot1: {
        label: "1F",
      },
      slot2: {
        label: "2C",
      },
    },
  },
  76: {
    matchNumber: 76,
    stage: "Round of 32",
    venue: "Houston Stadium",
    city: "Houston",
    country: "USA",
    scheduledDate: "June 29, 2026",
    description: "FIFA World Cup 2026 – Match 76 (Round of 32) at Houston Stadium, Houston",
    bracket: {
      slot1: {
        label: "1C",
      },
      slot2: {
        label: "2F",
      },
    },
  },
  77: {
    matchNumber: 77,
    stage: "Round of 32",
    venue: "New York New Jersey Stadium",
    city: "New York / New Jersey",
    country: "USA",
    scheduledDate: "June 30, 2026",
    description: "FIFA World Cup 2026 – Match 77 (Round of 32) at New York New Jersey Stadium, New York / New Jersey",
    bracket: {
      slot1: {
        label: "1I",
      },
      slot2: {
        label: "3rd Place",
      },
    },
  },
  78: {
    matchNumber: 78,
    stage: "Round of 32",
    venue: "Dallas Stadium",
    city: "Dallas",
    country: "USA",
    scheduledDate: "June 30, 2026",
    description: "FIFA World Cup 2026 – Match 78 (Round of 32) at Dallas Stadium, Dallas",
    bracket: {
      slot1: {
        label: "2E",
      },
      slot2: {
        label: "2I",
      },
    },
  },
  79: {
    matchNumber: 79,
    stage: "Round of 32",
    venue: "Mexico City Stadium",
    city: "Mexico City",
    country: "Mexico",
    scheduledDate: "June 30, 2026",
    description: "FIFA World Cup 2026 – Match 79 (Round of 32) at Mexico City Stadium, Mexico City",
    bracket: {
      slot1: {
        label: "1A",
      },
      slot2: {
        label: "3rd Place",
      },
    },
  },
  80: {
    matchNumber: 80,
    stage: "Round of 32",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    country: "USA",
    scheduledDate: "July 1, 2026",
    description: "FIFA World Cup 2026 – Match 80 (Round of 32) at Atlanta Stadium, Atlanta",
    bracket: {
      slot1: {
        label: "1L",
      },
      slot2: {
        label: "2H",
      },
    },
  },
  81: {
    matchNumber: 81,
    stage: "Round of 32",
    venue: "San Francisco Bay Area Stadium",
    city: "San Francisco Bay Area",
    country: "USA",
    scheduledDate: "July 1, 2026",
    description: "FIFA World Cup 2026 – Match 81 (Round of 32) at San Francisco Bay Area Stadium, San Francisco Bay Area",
    bracket: {
      slot1: {
        label: "1D",
      },
      slot2: {
        label: "3rd Place",
      },
    },
  },
  82: {
    matchNumber: 82,
    stage: "Round of 32",
    venue: "Seattle Stadium",
    city: "Seattle",
    country: "USA",
    scheduledDate: "July 1, 2026",
    description: "FIFA World Cup 2026 – Match 82 (Round of 32) at Seattle Stadium, Seattle",
    bracket: {
      slot1: {
        label: "1G",
      },
      slot2: {
        label: "3rd Place",
      },
    },
  },
  83: {
    matchNumber: 83,
    stage: "Round of 32",
    venue: "Toronto Stadium",
    city: "Toronto",
    country: "Canada",
    scheduledDate: "July 2, 2026",
    description: "FIFA World Cup 2026 – Match 83 (Round of 32) at Toronto Stadium, Toronto",
    bracket: {
      slot1: {
        label: "2K",
      },
      slot2: {
        label: "2L",
      },
    },
  },
  84: {
    matchNumber: 84,
    stage: "Round of 32",
    venue: "Philadelphia Stadium",
    city: "Philadelphia",
    country: "USA",
    scheduledDate: "July 2, 2026",
    description: "FIFA World Cup 2026 – Match 84 (Round of 32) at Philadelphia Stadium, Philadelphia",
    bracket: {
      slot1: {
        label: "1J",
      },
      slot2: {
        label: "2K",
      },
    },
  },
  85: {
    matchNumber: 85,
    stage: "Round of 32",
    venue: "BC Place Vancouver",
    city: "Vancouver",
    country: "Canada",
    scheduledDate: "July 2, 2026",
    description: "FIFA World Cup 2026 – Match 85 (Round of 32) at BC Place Vancouver, Vancouver",
    bracket: {
      slot1: {
        label: "1B",
      },
      slot2: {
        label: "3AEHIJ",
      },
    },
  },
  86: {
    matchNumber: 86,
    stage: "Round of 32",
    venue: "Miami Stadium",
    city: "Miami",
    country: "USA",
    scheduledDate: "July 3, 2026",
    description: "FIFA World Cup 2026 – Match 86 (Round of 32) at Miami Stadium, Miami",
    bracket: {
      slot1: {
        label: "1H",
      },
      slot2: {
        label: "3rd Place",
      },
    },
  },
  87: {
    matchNumber: 87,
    stage: "Round of 32",
    venue: "Kansas City Stadium",
    city: "Kansas City",
    country: "USA",
    scheduledDate: "July 3, 2026",
    description: "FIFA World Cup 2026 – Match 87 (Round of 32) at Kansas City Stadium, Kansas City",
    bracket: {
      slot1: {
        label: "1K",
      },
      slot2: {
        label: "3DEIJL",
      },
    },
  },
  88: {
    matchNumber: 88,
    stage: "Round of 32",
    venue: "Estadio Guadalajara",
    city: "Guadalajara",
    country: "Mexico",
    scheduledDate: "July 3, 2026",
    description: "FIFA World Cup 2026 – Match 88 (Round of 32) at Estadio Guadalajara, Guadalajara",
    bracket: {
      slot1: {
        label: "2G",
      },
      slot2: {
        label: "2D",
      },
    },
  },
  89: {
    matchNumber: 89,
    stage: "Round of 16",
    venue: "Philadelphia Stadium",
    city: "Philadelphia",
    country: "USA",
    scheduledDate: "July 4, 2026",
    description: "FIFA World Cup 2026 – Match 89 (Round of 16) at Philadelphia Stadium, Philadelphia",
    bracket: {
      slot1: {
        matchNumber: 74,
        label: "W74",
      },
      slot2: {
        matchNumber: 77,
        label: "W77",
      },
    },
  },
  90: {
    matchNumber: 90,
    stage: "Round of 16",
    venue: "Houston Stadium",
    city: "Houston",
    country: "USA",
    scheduledDate: "July 4, 2026",
    description: "FIFA World Cup 2026 – Match 90 (Round of 16) at Houston Stadium, Houston",
    bracket: {
      slot1: {
        matchNumber: 73,
        label: "W73",
      },
      slot2: {
        matchNumber: 75,
        label: "W75",
      },
    },
  },
  91: {
    matchNumber: 91,
    stage: "Round of 16",
    venue: "New York New Jersey Stadium",
    city: "New York / New Jersey",
    country: "USA",
    scheduledDate: "July 5, 2026",
    description: "FIFA World Cup 2026 – Match 91 (Round of 16) at New York New Jersey Stadium, New York / New Jersey",
    bracket: {
      slot1: {
        matchNumber: 76,
        label: "W76",
      },
      slot2: {
        matchNumber: 78,
        label: "W78",
      },
    },
  },
  92: {
    matchNumber: 92,
    stage: "Round of 16",
    venue: "Mexico City Stadium",
    city: "Mexico City",
    country: "Mexico",
    scheduledDate: "July 5, 2026",
    description: "FIFA World Cup 2026 – Match 92 (Round of 16) at Mexico City Stadium, Mexico City",
    bracket: {
      slot1: {
        matchNumber: 79,
        label: "W79",
      },
      slot2: {
        matchNumber: 80,
        label: "W80",
      },
    },
  },
  93: {
    matchNumber: 93,
    stage: "Round of 16",
    venue: "Dallas Stadium",
    city: "Dallas",
    country: "USA",
    scheduledDate: "July 6, 2026",
    description: "FIFA World Cup 2026 – Match 93 (Round of 16) at Dallas Stadium, Dallas",
    bracket: {
      slot1: {
        matchNumber: 83,
        label: "W83",
      },
      slot2: {
        matchNumber: 84,
        label: "W84",
      },
    },
  },
  94: {
    matchNumber: 94,
    stage: "Round of 16",
    venue: "Seattle Stadium",
    city: "Seattle",
    country: "USA",
    scheduledDate: "July 6, 2026",
    description: "FIFA World Cup 2026 – Match 94 (Round of 16) at Seattle Stadium, Seattle",
    bracket: {
      slot1: {
        matchNumber: 81,
        label: "W81",
      },
      slot2: {
        matchNumber: 82,
        label: "W82",
      },
    },
  },
  95: {
    matchNumber: 95,
    stage: "Round of 16",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    country: "USA",
    scheduledDate: "July 7, 2026",
    description: "FIFA World Cup 2026 – Match 95 (Round of 16) at Atlanta Stadium, Atlanta",
    bracket: {
      slot1: {
        matchNumber: 86,
        label: "W86",
      },
      slot2: {
        matchNumber: 88,
        label: "W88",
      },
    },
  },
  96: {
    matchNumber: 96,
    stage: "Round of 16",
    venue: "BC Place Vancouver",
    city: "Vancouver",
    country: "Canada",
    scheduledDate: "July 7, 2026",
    description: "FIFA World Cup 2026 – Match 96 (Round of 16) at BC Place Vancouver, Vancouver",
    bracket: {
      slot1: {
        matchNumber: 85,
        label: "W85",
        // Via R32 M85: 1st place Group B vs 3rd-place best (pool A/E/H/I/J).
        // hostTeamSlot suppresses 3rd-place probability here (Group B host).
        sideA: { group: "B" },
        sideB: { thirdPlace: true, eligibleGroups: ["A", "E", "H", "I", "J"] },
        hostTeamSlot: true,
      },
      slot2: {
        matchNumber: 87,
        label: "W87",
        // Via R32 M87: 1st place Group K vs 3rd-place best (pool D/E/I/J/L).
        sideA: { group: "K" },
        sideB: { thirdPlace: true, eligibleGroups: ["D", "E", "I", "J", "L"] },
      },
    },
  },
  97: {
    matchNumber: 97,
    stage: "Quarter-final",
    venue: "Boston Stadium",
    city: "Boston",
    country: "USA",
    scheduledDate: "July 9, 2026",
    description: "FIFA World Cup 2026 – Match 97 (Quarter-final) at Boston Stadium, Boston",
    bracket: {
      slot1: {
        matchNumber: 89,
        label: "W89",
      },
      slot2: {
        matchNumber: 90,
        label: "W90",
      },
    },
  },
  98: {
    matchNumber: 98,
    stage: "Quarter-final",
    venue: "Los Angeles Stadium",
    city: "Los Angeles",
    country: "USA",
    scheduledDate: "July 10, 2026",
    description: "FIFA World Cup 2026 – Match 98 (Quarter-final) at Los Angeles Stadium, Los Angeles",
    bracket: {
      slot1: {
        matchNumber: 93,
        label: "W93",
      },
      slot2: {
        matchNumber: 94,
        label: "W94",
      },
    },
  },
  99: {
    matchNumber: 99,
    stage: "Quarter-final",
    venue: "Miami Stadium",
    city: "Miami",
    country: "USA",
    scheduledDate: "July 11, 2026",
    description: "FIFA World Cup 2026 – Match 99 (Quarter-final) at Miami Stadium, Miami",
    bracket: {
      slot1: {
        matchNumber: 91,
        label: "W91",
      },
      slot2: {
        matchNumber: 92,
        label: "W92",
      },
    },
  },
  100: {
    matchNumber: 100,
    stage: "Quarter-final",
    venue: "Kansas City Stadium",
    city: "Kansas City",
    country: "USA",
    scheduledDate: "July 11, 2026",
    description: "FIFA World Cup 2026 – Match 100 (Quarter-final) at Kansas City Stadium, Kansas City",
    bracket: {
      slot1: {
        matchNumber: 95,
        label: "W95",
      },
      slot2: {
        matchNumber: 96,
        label: "W96",
      },
    },
  },
  101: {
    matchNumber: 101,
    stage: "Semi-final",
    venue: "Dallas Stadium",
    city: "Dallas",
    country: "USA",
    scheduledDate: "July 14, 2026",
    description: "FIFA World Cup 2026 – Match 101 (Semi-final) at Dallas Stadium, Dallas",
    bracket: {
      slot1: {
        matchNumber: 97,
        label: "W97",
      },
      slot2: {
        matchNumber: 98,
        label: "W98",
      },
    },
  },
  102: {
    matchNumber: 102,
    stage: "Semi-final",
    venue: "Atlanta Stadium",
    city: "Atlanta",
    country: "USA",
    scheduledDate: "July 15, 2026",
    description: "FIFA World Cup 2026 – Match 102 (Semi-final) at Atlanta Stadium, Atlanta",
    bracket: {
      slot1: {
        matchNumber: 99,
        label: "W99",
      },
      slot2: {
        matchNumber: 100,
        label: "W100",
      },
    },
  },
  103: {
    matchNumber: 103,
    stage: "Third Place Play-off",
    venue: "Miami Stadium",
    city: "Miami",
    country: "USA",
    scheduledDate: "July 18, 2026",
    description: "FIFA World Cup 2026 – Match 103 (Third Place Play-off) at Miami Stadium, Miami",
    bracket: {
      slot1: {
        matchNumber: 101,
        label: "L101",
      },
      slot2: {
        matchNumber: 102,
        label: "L102",
      },
    },
  },
  104: {
    matchNumber: 104,
    stage: "Final",
    venue: "New York New Jersey Stadium",
    city: "New York / New Jersey",
    country: "USA",
    scheduledDate: "July 19, 2026",
    description: "FIFA World Cup 2026 – Match 104 (Final) at New York New Jersey Stadium, New York / New Jersey",
    bracket: {
      slot1: {
        matchNumber: 101,
        label: "W101",
      },
      slot2: {
        matchNumber: 102,
        label: "W102",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Team data
//
// Static list of all 48 teams with their group, flag, and confederation.
// Base probabilities are NOT stored here – they are computed at run-time
// by computeProbabilityForMatch() from the bracket configuration, so the
// correct probability for every path (1st-place, 3rd-place, etc.) is derived
// automatically from the bracket structure.
// ---------------------------------------------------------------------------

export const TEAM_DATA = [
  // Group A – no path to Match 96
  { name: "Mexico",                            code: "MEX",   flag: "🇲🇽", confederation: "CONCACAF", isHost: true, group: "A" },
  { name: "South Africa",                      code: "RSA",   flag: "🇿🇦", confederation: "CAF",                   group: "A" },
  { name: "South Korea",                       code: "KOR",   flag: "🇰🇷", confederation: "AFC",                   group: "A" },
  { name: "Czech Republic",                    code: "CZE", flag: "🏳️",  confederation: "UEFA",                  group: "A" },

  // Group B – 1st place leads to Match 96 via R32 M85: P = 1/4 × 0.5 = 12.5%
  { name: "Canada",                            code: "CAN",   flag: "🇨🇦", confederation: "CONCACAF", isHost: true, group: "B" },
  { name: "Bosnia & Herzegovina",              code: "BIH", flag: "🏳️", confederation: "UEFA",                  group: "B" },
  { name: "Qatar",                             code: "QAT",   flag: "🇶🇦", confederation: "AFC",                   group: "B" },
  { name: "Switzerland",                       code: "SUI",   flag: "🇨🇭", confederation: "UEFA",                  group: "B" },

  // Group C – no path to Match 96
  { name: "Brazil",                            code: "BRA",   flag: "🇧🇷", confederation: "CONMEBOL",              group: "C" },
  { name: "Morocco",                           code: "MAR",   flag: "🇲🇦", confederation: "CAF",                   group: "C" },
  { name: "Haiti",                             code: "HAI",   flag: "🇭🇹", confederation: "CONCACAF",              group: "C" },
  { name: "Scotland",                          code: "SCO",   flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA",                  group: "C" },

  // Group D – 3rd place eligible for R32 M87 best-3rd pool (D/E/I/J/L): P = 1/4 × 1/5 × 0.5 = 2.5%
  { name: "United States",                     code: "USA",   flag: "🇺🇸", confederation: "CONCACAF", isHost: true, group: "D" },
  { name: "Paraguay",                          code: "PAR",   flag: "🇵🇾", confederation: "CONMEBOL",              group: "D" },
  { name: "Australia",                         code: "AUS",   flag: "🇦🇺", confederation: "AFC",                   group: "D" },
  { name: "Türkiye",                           code: "TUR", flag: "🏳️",  confederation: "UEFA",                  group: "D" },

  // Group E – 3rd place in M87 pool only (M85 path excluded: E teams would play Canada in M85): P = 1/4 × 1/5 × 0.5 = 2.5%
  { name: "Germany",                           code: "GER",   flag: "🇩🇪", confederation: "UEFA",                  group: "E" },
  { name: "Curaçao",                           code: "CUW",   flag: "🇨🇼", confederation: "CONCACAF",              group: "E" },
  { name: "Ivory Coast",                       code: "CIV",   flag: "🇨🇮", confederation: "CAF",                   group: "E" },
  { name: "Ecuador",                           code: "ECU",   flag: "🇪🇨", confederation: "CONMEBOL",              group: "E" },

  // Group F – 3rd place only in M85 pool (E/F/G/I/J), which is excluded (F teams play Canada in M85): P = 0%
  { name: "Netherlands",                       code: "NED",   flag: "🇳🇱", confederation: "UEFA",                  group: "F" },
  { name: "Japan",                             code: "JPN",   flag: "🇯🇵", confederation: "AFC",                   group: "F" },
  { name: "Sweden",                            code: "SWE", flag: "🏳️",  confederation: "UEFA",                  group: "F" },
  { name: "Tunisia",                           code: "TUN",   flag: "🇹🇳", confederation: "CAF",                   group: "F" },

  // Group G – 3rd place only in M85 pool (E/F/G/I/J), which is excluded (G teams play Canada in M85): P = 0%
  { name: "Belgium",                           code: "BEL",   flag: "🇧🇪", confederation: "UEFA",                  group: "G" },
  { name: "Egypt",                             code: "EGY",   flag: "🇪🇬", confederation: "CAF",                   group: "G" },
  { name: "Iran",                              code: "IRN",   flag: "🇮🇷", confederation: "AFC",                   group: "G" },
  { name: "New Zealand",                       code: "NZL",   flag: "🇳🇿", confederation: "OFC",                   group: "G" },

  // Group H – no path to Match 96
  { name: "Spain",                             code: "ESP",   flag: "🇪🇸", confederation: "UEFA",                  group: "H" },
  { name: "Cape Verde",                        code: "CPV",   flag: "🇨🇻", confederation: "CAF",                   group: "H" },
  { name: "Saudi Arabia",                      code: "KSA",   flag: "🇸🇦", confederation: "AFC",                   group: "H" },
  { name: "Uruguay",                           code: "URU",   flag: "🇺🇾", confederation: "CONMEBOL",              group: "H" },

  // Group I – 3rd place in M87 pool only (M85 path excluded: I teams would play Canada in M85): P = 1/4 × 1/5 × 0.5 = 2.5%
  { name: "France",                            code: "FRA",   flag: "🇫🇷", confederation: "UEFA",                  group: "I" },
  { name: "Senegal",                           code: "SEN",   flag: "🇸🇳", confederation: "CAF",                   group: "I" },
  { name: "Iraq",                              code: "IRQ", flag: "🏳️",  confederation: "AFC",                   group: "I" },
  { name: "Norway",                            code: "NOR",   flag: "🇳🇴", confederation: "UEFA",                  group: "I" },

  // Group J – 3rd place in M87 pool only (M85 path excluded: J teams would play Canada in M85): P = 1/4 × 1/5 × 0.5 = 2.5%
  { name: "Argentina",                         code: "ARG",   flag: "🇦🇷", confederation: "CONMEBOL",              group: "J" },
  { name: "Algeria",                           code: "ALG",   flag: "🇩🇿", confederation: "CAF",                   group: "J" },
  { name: "Austria",                           code: "AUT",   flag: "🇦🇹", confederation: "UEFA",                  group: "J" },
  { name: "Jordan",                            code: "JOR",   flag: "🇯🇴", confederation: "AFC",                   group: "J" },

  // Group K – 1st place leads to Match 96 via R32 M87: P = 1/4 × 0.5 = 12.5%
  { name: "Portugal",                          code: "POR",   flag: "🇵🇹", confederation: "UEFA",                  group: "K" },
  { name: "DR Congo",                          code: "COD", flag: "🏳️",  confederation: "CAF",                   group: "K" },
  { name: "Uzbekistan",                        code: "UZB",   flag: "🇺🇿", confederation: "AFC",                   group: "K" },
  { name: "Colombia",                          code: "COL",   flag: "🇨🇴", confederation: "CONMEBOL",              group: "K" },

  // Group L – 3rd place eligible for R32 M87 best-3rd pool (D/E/I/J/L): P = 2.5%
  { name: "England",                           code: "ENG",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA",                  group: "L" },
  { name: "Croatia",                           code: "CRO",   flag: "🇭🇷", confederation: "UEFA",                  group: "L" },
  { name: "Ghana",                             code: "GHA",   flag: "🇬🇭", confederation: "CAF",                   group: "L" },
  { name: "Panama",                            code: "PAN",   flag: "🇵🇦", confederation: "CONCACAF",              group: "L" },
];

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
  96: {
    matchNumber: 96,
    stage: "Round of 16",
    venue: "BC Place",
    city: "Vancouver",
    country: "Canada",
    scheduledDate: "July 7, 2026",
    description: "FIFA World Cup 2026 – Match 96 (Round of 16) at BC Place, Vancouver",
    bracket: {
      // Slot 1 enters Match 96 via R32 Match 85
      // hostTeamSlot: true – Canada (Group B) plays the sideB team here in R32 M85.
      // A sideB team that wins M85 eliminates Canada and cannot then play Canada in M96.
      // Therefore sideB paths for this slot are excluded from the M96 probability calculation.
      slot1: {
        r32Label: "R32 Match 85",
        sideA: { group: "B", position: 1 }, // 1st Group B plays best 3rd from EFGIJ
        sideB: { thirdPlace: true, eligibleGroups: ["E", "F", "G", "I", "J"], label: "3EFGIJ" },
        hostTeamSlot: true,
      },
      // Slot 2 enters Match 96 via R32 Match 87
      slot2: {
        r32Label: "R32 Match 87",
        sideA: { group: "K", position: 1 }, // 1st Group K plays best 3rd from DEIJL
        sideB: { thirdPlace: true, eligibleGroups: ["D", "E", "I", "J", "L"], label: "3DEIJL" },
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
  { name: "TBC (Denmark / Czech Republic)",    code: "TBC_A", flag: "🏳️",  confederation: "UEFA",                  group: "A" },

  // Group B – 1st place leads to Match 96 via R32 M85: P = 1/4 × 0.5 = 12.5%
  { name: "Canada",                            code: "CAN",   flag: "🇨🇦", confederation: "CONCACAF", isHost: true, group: "B" },
  { name: "TBC (Italy / Bosnia & Herzegovina)", code: "TBC_B", flag: "🏳️", confederation: "UEFA",                  group: "B" },
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
  { name: "TBC (Türkiye / Kosovo)",            code: "TBC_D", flag: "🏳️",  confederation: "UEFA",                  group: "D" },

  // Group E – 3rd place in M87 pool only (M85 path excluded: E teams would play Canada in M85): P = 1/4 × 1/5 × 0.5 = 2.5%
  { name: "Germany",                           code: "GER",   flag: "🇩🇪", confederation: "UEFA",                  group: "E" },
  { name: "Curaçao",                           code: "CUW",   flag: "🇨🇼", confederation: "CONCACAF",              group: "E" },
  { name: "Ivory Coast",                       code: "CIV",   flag: "🇨🇮", confederation: "CAF",                   group: "E" },
  { name: "Ecuador",                           code: "ECU",   flag: "🇪🇨", confederation: "CONMEBOL",              group: "E" },

  // Group F – 3rd place only in M85 pool (E/F/G/I/J), which is excluded (F teams play Canada in M85): P = 0%
  { name: "Netherlands",                       code: "NED",   flag: "🇳🇱", confederation: "UEFA",                  group: "F" },
  { name: "Japan",                             code: "JPN",   flag: "🇯🇵", confederation: "AFC",                   group: "F" },
  { name: "TBC (Sweden / Poland)",             code: "TBC_F", flag: "🏳️",  confederation: "UEFA",                  group: "F" },
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
  { name: "TBC (Iraq / Bolivia)",              code: "TBC_I", flag: "🏳️",  confederation: "AFC",                   group: "I" },
  { name: "Norway",                            code: "NOR",   flag: "🇳🇴", confederation: "UEFA",                  group: "I" },

  // Group J – 3rd place in M87 pool only (M85 path excluded: J teams would play Canada in M85): P = 1/4 × 1/5 × 0.5 = 2.5%
  { name: "Argentina",                         code: "ARG",   flag: "🇦🇷", confederation: "CONMEBOL",              group: "J" },
  { name: "Algeria",                           code: "ALG",   flag: "🇩🇿", confederation: "CAF",                   group: "J" },
  { name: "Austria",                           code: "AUT",   flag: "🇦🇹", confederation: "UEFA",                  group: "J" },
  { name: "Jordan",                            code: "JOR",   flag: "🇯🇴", confederation: "AFC",                   group: "J" },

  // Group K – 1st place leads to Match 96 via R32 M87: P = 1/4 × 0.5 = 12.5%
  { name: "Portugal",                          code: "POR",   flag: "🇵🇹", confederation: "UEFA",                  group: "K" },
  { name: "TBC (DR Congo / Jamaica)",          code: "TBC_K", flag: "🏳️",  confederation: "CAF",                   group: "K" },
  { name: "Uzbekistan",                        code: "UZB",   flag: "🇺🇿", confederation: "AFC",                   group: "K" },
  { name: "Colombia",                          code: "COL",   flag: "🇨🇴", confederation: "CONMEBOL",              group: "K" },

  // Group L – 3rd place eligible for R32 M87 best-3rd pool (D/E/I/J/L): P = 2.5%
  { name: "England",                           code: "ENG",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA",                  group: "L" },
  { name: "Croatia",                           code: "CRO",   flag: "🇭🇷", confederation: "UEFA",                  group: "L" },
  { name: "Ghana",                             code: "GHA",   flag: "🇬🇭", confederation: "CAF",                   group: "L" },
  { name: "Panama",                            code: "PAN",   flag: "🇵🇦", confederation: "CONCACAF",              group: "L" },
];

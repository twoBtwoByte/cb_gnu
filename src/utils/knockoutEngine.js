const GROUP_STAGE = "Group Stage";
const MATCH_REFERENCE_PATTERN = /^(Winner|Runner-up)\s+match\s+(\d+)$/i;
const MATCH_PARTICIPANTS = 2;
const UNRESOLVED_WIN_PROBABILITY = 0.5;

const COUNTRY_ALIASES = new Map([
  ["south korea", "korea republic"],
  ["united states", "usa"],
  ["ivory coast", "cote d'ivoire"],
  ["iran", "ir iran"],
  ["cape verde", "cabo verde"],
  ["dr congo", "congo dr"],
  ["bosnia & herzegovina", "bosnia and herzegovina"],
  ["bosnia-herzegovina", "bosnia and herzegovina"],
]);

export const toSlug = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export const toCanonicalCountrySlug = (value = "") => {
  const slug = toSlug(value);
  return COUNTRY_ALIASES.get(slug) ?? slug;
};

export const isMatchReferenceLabel = (label) => MATCH_REFERENCE_PATTERN.test(label);

export const extractBracketLabels = (match) =>
  Object.values(match?.bracket ?? {})
    .map((slot) => (typeof slot?.label === "string" ? slot.label.trim() : ""))
    .filter(Boolean);

const getCompletedResult = (completedResults, matchNumber) =>
  completedResults?.[String(matchNumber)] ?? completedResults?.[matchNumber] ?? null;

const resolveMatchOutcome = (result) => {
  if (!result) return null;

  const { homeTeam, awayTeam, homeScore, awayScore } = result;
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore) || homeScore === awayScore) {
    return null;
  }

  const winnerTeam = homeScore > awayScore ? homeTeam : awayTeam;
  const loserTeam = homeScore > awayScore ? awayTeam : homeTeam;

  return {
    winnerSlug: toCanonicalCountrySlug(winnerTeam),
    loserSlug: toCanonicalCountrySlug(loserTeam),
  };
};

const getAdvancementMultiplier = ({ matchNumber, country, isWinner, completedResults }) => {
  const outcome = resolveMatchOutcome(getCompletedResult(completedResults, matchNumber));
  if (!outcome) return UNRESOLVED_WIN_PROBABILITY;

  const countrySlug = toCanonicalCountrySlug(country);
  if (isWinner) {
    return countrySlug === outcome.winnerSlug ? 1 : 0;
  }

  return countrySlug === outcome.loserSlug ? 1 : 0;
};

const addToProbabilityMap = (targetMap, sourceMap, multiplier = 1) => {
  sourceMap.forEach((value, key) => {
    const nextValue = value * multiplier;
    if (nextValue <= 0) return;
    targetMap.set(key, (targetMap.get(key) ?? 0) + nextValue);
  });
};

export function createKnockoutProbabilityEngine({ matchMap, completedResults = {} } = {}) {
  const labelCache = new Map();
  const matchParticipationCache = new Map();

  const resolveLabelProbabilities = (label, resolving = new Set()) => {
    if (labelCache.has(label)) return labelCache.get(label);

    const matchReference = label.match(MATCH_REFERENCE_PATTERN);
    if (matchReference) {
      const [, referenceType, matchNumberString] = matchReference;
      const matchNumber = Number.parseInt(matchNumberString, 10);

      if (resolving.has(matchNumber)) {
        const empty = new Map();
        labelCache.set(label, empty);
        return empty;
      }

      resolving.add(matchNumber);
      const sourceParticipation = getMatchParticipation(matchNumber, resolving);
      const isWinner = referenceType.toLowerCase() === "winner";
      const result = new Map();

      sourceParticipation.forEach((probability, country) => {
        const multiplier = getAdvancementMultiplier({
          matchNumber,
          country,
          isWinner,
          completedResults,
        });
        addToProbabilityMap(result, new Map([[country, probability]]), multiplier);
      });

      resolving.delete(matchNumber);
      labelCache.set(label, result);
      return result;
    }

    const result = new Map([[label, 1]]);
    labelCache.set(label, result);
    return result;
  };

  function getMatchParticipation(matchNumber, resolving = new Set()) {
    if (matchParticipationCache.has(matchNumber)) {
      return matchParticipationCache.get(matchNumber);
    }

    const match = matchMap.get(matchNumber);
    const participation = new Map();

    if (!match) {
      matchParticipationCache.set(matchNumber, participation);
      return participation;
    }

    if (match.stage === GROUP_STAGE) {
      extractBracketLabels(match)
        .slice(0, MATCH_PARTICIPANTS)
        .forEach((label) => {
          participation.set(label, 1);
        });
      matchParticipationCache.set(matchNumber, participation);
      return participation;
    }

    extractBracketLabels(match)
      .slice(0, MATCH_PARTICIPANTS)
      .forEach((label) => {
        addToProbabilityMap(
          participation,
          resolveLabelProbabilities(label, new Set(resolving)),
          1
        );
      });

    matchParticipationCache.set(matchNumber, participation);
    return participation;
  }

  const getSlotProbabilities = (match) =>
    extractBracketLabels(match)
      .slice(0, MATCH_PARTICIPANTS)
      .map((label) => resolveLabelProbabilities(label));

  return {
    getMatchParticipation,
    getSlotProbabilities,
    resolveLabelProbabilities,
  };
}

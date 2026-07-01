import { ELIMINATED_GROUP_STAGE_TEAMS } from "../../config/worldCupConfig.js";
import {
  createKnockoutProbabilityEngine,
  extractBracketLabels,
  isMatchReferenceLabel,
  toCanonicalCountrySlug,
} from "../../domain/knockout/knockoutProbabilityEngine.js";

const GROUP_STAGE = "Group Stage";
const GROUP_QUALIFIER_PATTERN = /^Group\s+([A-L])\s+(winners|runners-up)$/i;
const GROUP_THIRD_PLACE_PATTERN = /^Group\s+([A-L](?:\/[A-L])+)\s+third\s+place$/i;
const MATCH_PARTICIPANTS = 2;

const ELIMINATED_GROUP_STAGE_COUNTRY_SLUGS = new Set(
  ELIMINATED_GROUP_STAGE_TEAMS.map((team) => toCanonicalCountrySlug(team.name))
);

const isEliminatedGroupStageCountry = (country) =>
  ELIMINATED_GROUP_STAGE_COUNTRY_SLUGS.has(toCanonicalCountrySlug(country));

const isStructuredBracketLabel = (label) =>
  GROUP_QUALIFIER_PATTERN.test(label) ||
  GROUP_THIRD_PLACE_PATTERN.test(label) ||
  isMatchReferenceLabel(label);

const removeEliminatedGroupStageCountries = (probabilities) =>
  new Map([...probabilities.entries()].filter(([country]) => !isEliminatedGroupStageCountry(country)));

const toOpponentCode = (label = "") => {
  const qualifierMatch = label.match(GROUP_QUALIFIER_PATTERN);
  if (qualifierMatch) {
    const [, group, position] = qualifierMatch;
    return `${position.toLowerCase() === "winners" ? "1" : "2"}${group.toUpperCase()}`;
  }

  const thirdPlaceMatch = label.match(GROUP_THIRD_PLACE_PATTERN);
  if (thirdPlaceMatch) {
    const [, groupsExpression] = thirdPlaceMatch;
    return `3${groupsExpression.toUpperCase().replace(/\//g, "")}`;
  }

  const matchReference = label.match(/^(Winner|Runner-up)\s+match\s+(\d+)$/i);
  if (matchReference) {
    const [, referenceType, matchNumber] = matchReference;
    return `${referenceType.toLowerCase() === "winner" ? "W" : "RU"}${matchNumber}`;
  }

  return label;
};

const roundToThreeDecimals = (value) => Math.round(value * 1000) / 1000;

const toPercentage = (probability) => roundToThreeDecimals(probability * 100);

const getSlotEntries = ({ country, slotProbabilities }) =>
  slotProbabilities.reduce((entries, probabilityMap, slotIndex) => {
    const probability = probabilityMap?.get(country) ?? 0;
    if (probability > 0) {
      entries.push({
        slotNumber: slotIndex + 1,
        probability,
      });
    }
    return entries;
  }, []);

const resolveOpponentLabel = ({ country, match, probabilityEngine }) => {
  const labels = extractBracketLabels(match).slice(0, MATCH_PARTICIPANTS);
  if (labels.length < MATCH_PARTICIPANTS) return "";

  const slotCountrySets = labels.map((label) => {
    const probabilities = probabilityEngine.resolveLabelProbabilities(label);
    const filteredProbabilities =
      match.stage === GROUP_STAGE ? probabilities : removeEliminatedGroupStageCountries(probabilities);
    return new Set(filteredProbabilities.keys());
  });

  const countrySlotIndexes = slotCountrySets.reduce((indexes, countriesInSlot, slotIndex) => {
    if (countriesInSlot.has(country)) indexes.push(slotIndex);
    return indexes;
  }, []);
  const inferredCountrySlotIndex = countrySlotIndexes.length === 1 ? countrySlotIndexes[0] : 0;
  const opponentLabel = labels[inferredCountrySlotIndex === 0 ? 1 : 0];
  return toOpponentCode(opponentLabel);
};

const buildOpponentScenarios = ({ country, slotProbabilities }) => {
  const slotEntries = getSlotEntries({ country, slotProbabilities });
  const totalProbability = slotEntries.reduce((sum, entry) => sum + entry.probability, 0);
  if (!totalProbability) return [];

  return slotEntries
    .flatMap(({ slotNumber, probability }) => {
      const opponentSlotIndex = slotNumber === 1 ? 1 : 0;
      return [...(slotProbabilities[opponentSlotIndex] ?? new Map()).entries()]
        .filter(([opponentCountry]) => opponentCountry !== country)
        .map(([opponentCountry, opponentProbability]) => ({
          slotNumber,
          opponentCountry,
          probability: toPercentage((probability * opponentProbability) / totalProbability),
        }));
    })
    .sort(
      (left, right) =>
        left.slotNumber - right.slotNumber ||
        right.probability - left.probability ||
        left.opponentCountry.localeCompare(right.opponentCountry)
    );
};

const toTeamProbabilityEntry = ({ country, match, slotProbabilities, opponentLabel }) => {
  const slotEntries = getSlotEntries({ country, slotProbabilities });
  const probability = slotEntries.reduce((sum, entry) => sum + entry.probability, 0);
  if (!probability) return null;

  const opponentScenarios = buildOpponentScenarios({ country, slotProbabilities });

  return {
    ...match,
    teamCountry: country,
    probability: toPercentage(probability),
    slotNumbers: slotEntries.map((entry) => entry.slotNumber),
    primarySlotNumber: slotEntries[0]?.slotNumber ?? null,
    opponentScenarios,
    opponentLabel: opponentLabel || opponentScenarios[0]?.opponentCountry || "",
  };
};

const extractCountryOptions = (matches) => {
  const countries = new Set();

  matches
    .filter((match) => match.stage === GROUP_STAGE)
    .forEach((match) => {
      extractBracketLabels(match).forEach((label) => {
        if (!isStructuredBracketLabel(label)) {
          countries.add(label);
        }
      });
    });

  return [...countries].sort((left, right) => left.localeCompare(right));
};

export function buildScheduleExplorerModel(schedule, completedMatchResults = {}) {
  const safeSchedule = Array.isArray(schedule) ? schedule : [];
  const matches = [...safeSchedule]
    .filter((match) => Number.isInteger(match?.matchNumber))
    .sort((left, right) => left.matchNumber - right.matchNumber);

  const matchMap = new Map(matches.map((match) => [match.matchNumber, match]));
  const probabilityEngine = createKnockoutProbabilityEngine({ matchMap, completedResults: completedMatchResults });
  const countries = extractCountryOptions(matches);
  const venues = [...new Set(matches.map((match) => match.venue).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
  const hostCountries = [...new Set(matches.map((match) => match.country).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );

  const potentialMatchesByCountry = countries.reduce((accumulator, country) => {
    accumulator[country] = [];
    return accumulator;
  }, {});

  const venuesByCountry = countries.reduce((accumulator, country) => {
    accumulator[country] = new Set();
    return accumulator;
  }, {});

  const countriesByVenue = venues.reduce((accumulator, venue) => {
    accumulator[venue] = new Set();
    return accumulator;
  }, {});

  const matchesByHostCountry = hostCountries.reduce((accumulator, hostCountry) => {
    accumulator[hostCountry] = [];
    return accumulator;
  }, {});

  matches.forEach((match) => {
    const slotProbabilities = probabilityEngine
      .getSlotProbabilities(match)
      .map((probabilities) =>
        match.stage === GROUP_STAGE ? probabilities : removeEliminatedGroupStageCountries(probabilities)
      );

    const matchCountries = new Set();
    slotProbabilities.forEach((slotProbabilityMap) => {
      slotProbabilityMap.forEach((_probability, country) => matchCountries.add(country));
    });

    const possibleTeams = [...matchCountries]
      .map((country) =>
        toTeamProbabilityEntry({
          country,
          match,
          slotProbabilities,
          opponentLabel: resolveOpponentLabel({
            country,
            match,
            probabilityEngine,
          }),
        })
      )
      .filter(Boolean)
      .sort(
        (left, right) =>
          (left.primarySlotNumber ?? Number.MAX_SAFE_INTEGER) - (right.primarySlotNumber ?? Number.MAX_SAFE_INTEGER) ||
          right.probability - left.probability ||
          left.teamCountry.localeCompare(right.teamCountry)
      );

    possibleTeams.forEach((teamMatch) => {
      const country = teamMatch.teamCountry;
      if (!potentialMatchesByCountry[country]) return;
      potentialMatchesByCountry[country].push(teamMatch);
      if (match.venue) {
        venuesByCountry[country].add(match.venue);
        countriesByVenue[match.venue]?.add(country);
      }
    });

    if (match.country && matchesByHostCountry[match.country]) {
      matchesByHostCountry[match.country].push({
        ...match,
        possibleTeams,
      });
    }
  });

  return {
    matches,
    countries,
    venues,
    hostCountries,
    potentialMatchesByCountry,
    venuesByCountry,
    countriesByVenue,
    matchesByHostCountry,
  };
}

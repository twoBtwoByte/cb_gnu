import { TEAM_DATA } from "../../config/worldCupConfig.js";

const GROUP_STAGE = "Group Stage";
const GROUP_QUALIFIER_PATTERN = /^Group\s+([A-L])\s+(winners|runners-up)$/i;
const GROUP_THIRD_PLACE_PATTERN = /^Group\s+([A-L](?:\/[A-L])+)\s+third\s+place$/i;
const MATCH_REFERENCE_PATTERN = /^(Winner|Runner-up)\s+match\s+(\d+)$/i;
const MATCH_PARTICIPANTS = 2;
const KNOCKOUT_WIN_PROBABILITY = 0.5;

const COUNTRY_ALIASES = new Map([
  ["south korea", "korea republic"],
  ["united states", "usa"],
  ["ivory coast", "cote d'ivoire"],
  ["iran", "ir iran"],
  ["cape verde", "cabo verde"],
  ["dr congo", "congo dr"],
  ["bosnia & herzegovina", "bosnia and herzegovina"],
]);

// Normalizes country labels so schedule names can be matched against TEAM_DATA names.
const toSlug = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const toCanonicalCountrySlug = (value = "") => {
  const slug = toSlug(value);
  return COUNTRY_ALIASES.get(slug) ?? slug;
};

const extractBracketLabels = (match) =>
  Object.values(match?.bracket ?? {})
    .map((slot) => (typeof slot?.label === "string" ? slot.label.trim() : ""))
    .filter(Boolean);

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

  const matchReference = label.match(MATCH_REFERENCE_PATTERN);
  if (matchReference) {
    const [, referenceType, matchNumber] = matchReference;
    return `${referenceType.toLowerCase() === "winner" ? "W" : "RU"}${matchNumber}`;
  }

  return label;
};

const resolveOpponentLabel = ({ country, match, matchMap, groupCountryMap, cache }) => {
  const labels = extractBracketLabels(match).slice(0, MATCH_PARTICIPANTS);
  if (labels.length < MATCH_PARTICIPANTS) return "";

  const slotCountrySets = labels.map((label) =>
    new Set(
      resolveLabelProbabilities({
        label,
        matchMap,
        groupCountryMap,
        cache,
        resolving: new Set(),
      }).keys()
    )
  );

  const countrySlotIndexes = slotCountrySets.reduce((indexes, countriesInSlot, slotIndex) => {
    if (countriesInSlot.has(country)) indexes.push(slotIndex);
    return indexes;
  }, []);
  // Default to the first slot as the country side when it cannot be unambiguously inferred.
  const inferredCountrySlotIndex = countrySlotIndexes.length === 1 ? countrySlotIndexes[0] : 0;
  const opponentLabel = labels[inferredCountrySlotIndex === 0 ? 1 : 0];
  return toOpponentCode(opponentLabel);
};

const roundToThreeDecimals = (value) => Math.round(value * 1000) / 1000;

const toPercentage = (probability) => roundToThreeDecimals(probability * 100);

const addToProbabilityMap = (targetMap, sourceMap, multiplier = 1) => {
  sourceMap.forEach((value, key) => {
    targetMap.set(key, (targetMap.get(key) ?? 0) + value * multiplier);
  });
};

const extractCountryOptions = (matches) => {
  const countries = new Set();

  matches
    .filter((match) => match.stage === GROUP_STAGE)
    .forEach((match) => {
      extractBracketLabels(match).forEach((label) => countries.add(label));
    });

  return [...countries].sort((left, right) => left.localeCompare(right));
};

const buildGroupCountryMap = (countryOptions) => {
  const configGroupByCountry = new Map();

  TEAM_DATA.forEach((team) => {
    if (!team?.name || !team?.group) return;
    configGroupByCountry.set(toCanonicalCountrySlug(team.name), team.group);
  });

  return countryOptions.reduce((accumulator, country) => {
    const group = configGroupByCountry.get(toCanonicalCountrySlug(country));
    if (!group) return accumulator;

    if (!accumulator[group]) accumulator[group] = new Set();
    accumulator[group].add(country);

    return accumulator;
  }, {});
};

const resolveLabelProbabilities = ({ label, matchMap, groupCountryMap, cache, resolving }) => {
  if (cache.has(label)) return cache.get(label);

  const qualifierMatch = label.match(GROUP_QUALIFIER_PATTERN);
  if (qualifierMatch) {
    const [, group] = qualifierMatch;
    const groupCountries = [...(groupCountryMap[group] ?? [])];
    const groupSize = groupCountries.length || 1;
    const result = new Map(groupCountries.map((country) => [country, 1 / groupSize]));
    cache.set(label, result);
    return result;
  }

  const thirdPlaceMatch = label.match(GROUP_THIRD_PLACE_PATTERN);
  if (thirdPlaceMatch) {
    const [, groupsExpression] = thirdPlaceMatch;
    const groups = groupsExpression.split("/");
    const selectionWeight = groups.length ? 1 / groups.length : 0;
    const result = groups.reduce((countries, group) => {
      const groupCountries = [...(groupCountryMap[group] ?? [])];
      const groupSize = groupCountries.length || 1;
      groupCountries.forEach((country) => {
        countries.set(country, (countries.get(country) ?? 0) + (1 / groupSize) * selectionWeight);
      });
      return countries;
    }, new Map());

    cache.set(label, result);
    return result;
  }

  const matchReference = label.match(MATCH_REFERENCE_PATTERN);
  if (matchReference) {
    const [, referenceType, matchNumberString] = matchReference;
    const matchNumber = Number.parseInt(matchNumberString, 10);

    // Guard against malformed circular references in match labels.
    if (resolving.has(matchNumber)) return new Map();
    resolving.add(matchNumber);

    const referencedMatch = matchMap.get(matchNumber);
    const result = new Map();
    const isWinner = referenceType.toLowerCase() === "winner";
    const multiplier = isWinner ? KNOCKOUT_WIN_PROBABILITY : 1 - KNOCKOUT_WIN_PROBABILITY;

    if (referencedMatch) {
      extractBracketLabels(referencedMatch)
        .slice(0, MATCH_PARTICIPANTS)
        .forEach((nextLabel) => {
          addToProbabilityMap(
            result,
            resolveLabelProbabilities({
              label: nextLabel,
              matchMap,
              groupCountryMap,
              cache,
              resolving,
            }),
            multiplier
          );
        });
    }

    resolving.delete(matchNumber);
    cache.set(label, result);
    return result;
  }

  const result = new Map([[label, 1]]);
  cache.set(label, result);
  return result;
};

const buildOpponentScenarios = ({ country, slotProbabilities }) => {
  const [slot1Map, slot2Map] = slotProbabilities;
  const slot1Probability = slot1Map?.get(country) ?? 0;
  const slot2Probability = slot2Map?.get(country) ?? 0;
  const totalProbability = slot1Probability + slot2Probability;
  if (!totalProbability) return [];

  const jointProbabilities = new Map();

  (slot2Map ?? new Map()).forEach((opponentProbability, opponentCountry) => {
    if (!slot1Probability || opponentCountry === country) return;
    jointProbabilities.set(opponentCountry, (jointProbabilities.get(opponentCountry) ?? 0) + slot1Probability * opponentProbability);
  });

  (slot1Map ?? new Map()).forEach((opponentProbability, opponentCountry) => {
    if (!slot2Probability || opponentCountry === country) return;
    jointProbabilities.set(opponentCountry, (jointProbabilities.get(opponentCountry) ?? 0) + slot2Probability * opponentProbability);
  });

  return [...jointProbabilities.entries()]
    .map(([opponentCountry, jointProbability]) => ({
      opponentCountry,
      probability: toPercentage(jointProbability / totalProbability),
    }))
    .sort((left, right) => right.probability - left.probability || left.opponentCountry.localeCompare(right.opponentCountry));
};

const toTeamProbabilityEntry = ({ country, match, slotProbabilities, opponentLabel }) => {
  const slot1Probability = slotProbabilities[0]?.get(country) ?? 0;
  const slot2Probability = slotProbabilities[1]?.get(country) ?? 0;
  const probability = slot1Probability + slot2Probability;
  if (!probability) return null;

  const opponentScenarios = buildOpponentScenarios({ country, slotProbabilities });

  return {
    ...match,
    teamCountry: country,
    probability: toPercentage(probability),
    opponentScenarios,
    opponentLabel: opponentLabel || opponentScenarios[0]?.opponentCountry || "",
  };
};

export function buildScheduleExplorerModel(schedule) {
  const safeSchedule = Array.isArray(schedule) ? schedule : [];
  const matches = [...safeSchedule]
    .filter((match) => Number.isInteger(match?.matchNumber))
    .sort((left, right) => left.matchNumber - right.matchNumber);

  const matchMap = new Map(matches.map((match) => [match.matchNumber, match]));
  const countries = extractCountryOptions(matches);
  const venues = [...new Set(matches.map((match) => match.venue).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
  const hostCountries = [...new Set(matches.map((match) => match.country).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
  const groupCountryMap = buildGroupCountryMap(countries);

  const cache = new Map();
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
    const labels = extractBracketLabels(match).slice(0, MATCH_PARTICIPANTS);
    const slotProbabilities = labels.map((label) =>
      resolveLabelProbabilities({
        label,
        matchMap,
        groupCountryMap,
        cache,
        resolving: new Set(),
      })
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
            matchMap,
            groupCountryMap,
            cache,
          }),
        })
      )
      .filter(Boolean)
      .sort(
        (left, right) => right.probability - left.probability || left.teamCountry.localeCompare(right.teamCountry)
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

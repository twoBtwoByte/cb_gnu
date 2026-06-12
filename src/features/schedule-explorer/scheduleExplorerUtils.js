import { TEAM_DATA } from "../../config/worldCupConfig.js";

const GROUP_STAGE = "Group Stage";
const GROUP_QUALIFIER_PATTERN = /^Group\s+([A-L])\s+(winners|runners-up)$/i;
const GROUP_THIRD_PLACE_PATTERN = /^Group\s+([A-L](?:\/[A-L])+)\s+third\s+place$/i;
const MATCH_REFERENCE_PATTERN = /^(Winner|Runner-up)\s+match\s+(\d+)$/i;

const COUNTRY_ALIASES = new Map([
  ["south korea", "korea republic"],
  ["united states", "usa"],
  ["ivory coast", "cote d'ivoire"],
  ["iran", "ir iran"],
  ["cape verde", "cabo verde"],
  ["dr congo", "congo dr"],
  ["bosnia & herzegovina", "bosnia and herzegovina"],
]);

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

const resolveCountriesForLabel = ({ label, matchMap, groupCountryMap, cache, resolving }) => {
  if (cache.has(label)) return cache.get(label);

  const qualifierMatch = label.match(GROUP_QUALIFIER_PATTERN);
  if (qualifierMatch) {
    const [, group] = qualifierMatch;
    const result = new Set(groupCountryMap[group] ?? []);
    cache.set(label, result);
    return result;
  }

  const thirdPlaceMatch = label.match(GROUP_THIRD_PLACE_PATTERN);
  if (thirdPlaceMatch) {
    const [, groupsExpression] = thirdPlaceMatch;
    const result = groupsExpression.split("/").reduce((countries, group) => {
      (groupCountryMap[group] ?? []).forEach((country) => countries.add(country));
      return countries;
    }, new Set());

    cache.set(label, result);
    return result;
  }

  const matchReference = label.match(MATCH_REFERENCE_PATTERN);
  if (matchReference) {
    const [, , matchNumberString] = matchReference;
    const matchNumber = Number.parseInt(matchNumberString, 10);

    if (resolving.has(matchNumber)) return new Set();
    resolving.add(matchNumber);

    const referencedMatch = matchMap.get(matchNumber);
    const result = !referencedMatch
      ? new Set()
      : extractBracketLabels(referencedMatch).reduce((countries, nextLabel) => {
          resolveCountriesForLabel({
            label: nextLabel,
            matchMap,
            groupCountryMap,
            cache,
            resolving,
          }).forEach((country) => countries.add(country));
          return countries;
        }, new Set());

    resolving.delete(matchNumber);
    cache.set(label, result);
    return result;
  }

  const result = new Set([label]);
  cache.set(label, result);
  return result;
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

  matches.forEach((match) => {
    const matchCountries = extractBracketLabels(match).reduce((countriesInMatch, label) => {
      resolveCountriesForLabel({
        label,
        matchMap,
        groupCountryMap,
        cache,
        resolving: new Set(),
      }).forEach((country) => countriesInMatch.add(country));
      return countriesInMatch;
    }, new Set());

    matchCountries.forEach((country) => {
      if (!potentialMatchesByCountry[country]) return;
      potentialMatchesByCountry[country].push(match);
      if (match.venue) {
        venuesByCountry[country].add(match.venue);
        countriesByVenue[match.venue]?.add(country);
      }
    });
  });

  return {
    matches,
    countries,
    venues,
    potentialMatchesByCountry,
    venuesByCountry,
    countriesByVenue,
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";

const SPOTLIGHT_COUNTRY_PARAM = "country";
const LEGACY_SPOTLIGHT_COUNTRY_PARAM = "spotlightCountry";

const normalizeCountryName = (value = "") => value.trim().toLowerCase();

function getSpotlightCodeFromSearchParams(params, teamOptions) {
  const rawCountry =
    params.get(SPOTLIGHT_COUNTRY_PARAM) ?? params.get(LEGACY_SPOTLIGHT_COUNTRY_PARAM) ?? "";
  const normalizedCountry = normalizeCountryName(rawCountry);
  if (!normalizedCountry) return null;

  const spotlightTeam = teamOptions.find(
    (team) => normalizeCountryName(team.name) === normalizedCountry
  );

  return spotlightTeam?.code ?? null;
}

function getSpotlightCodeFromUrl(teamOptions) {
  if (typeof window === "undefined") return null;
  return getSpotlightCodeFromSearchParams(new URLSearchParams(window.location.search), teamOptions);
}

export function useSpotlightCountry(teamOptions) {
  const [spotlightCode, setSpotlightCode] = useState(() => getSpotlightCodeFromUrl(teamOptions));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = () => {
      setSpotlightCode(getSpotlightCodeFromUrl(teamOptions));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [teamOptions]);

  const selectedSpotlightTeamMeta = useMemo(
    () => teamOptions.find((team) => team.code === spotlightCode) ?? null,
    [spotlightCode, teamOptions]
  );

  const hasValidSpotlightSelection = Boolean(selectedSpotlightTeamMeta);

  const setSpotlightCountry = useCallback(
    (nextSpotlightCode) => {
      setSpotlightCode(nextSpotlightCode);

      if (typeof window === "undefined") return;

      const searchParams = new URLSearchParams(window.location.search);
      if (!nextSpotlightCode) {
        searchParams.delete(SPOTLIGHT_COUNTRY_PARAM);
        searchParams.delete(LEGACY_SPOTLIGHT_COUNTRY_PARAM);
      } else {
        const selectedTeam = teamOptions.find((team) => team.code === nextSpotlightCode);
        if (selectedTeam) {
          searchParams.set(SPOTLIGHT_COUNTRY_PARAM, selectedTeam.name);
        }
        searchParams.delete(LEGACY_SPOTLIGHT_COUNTRY_PARAM);
      }

      const search = searchParams.toString();
      const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", nextUrl);
    },
    [teamOptions]
  );

  const handleSpotlightCountryChange = useCallback(
    (event) => {
      setSpotlightCountry(event.target.value || null);
    },
    [setSpotlightCountry]
  );

  const handleQuickSelectCanada = useCallback(() => {
    setSpotlightCountry("CAN");
  }, [setSpotlightCountry]);

  return {
    spotlightCode,
    selectedSpotlightTeamMeta,
    hasValidSpotlightSelection,
    handleSpotlightCountryChange,
    handleQuickSelectCanada,
  };
}

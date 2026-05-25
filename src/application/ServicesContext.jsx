import React, { createContext, useContext, useMemo } from "react";
import { defaultProbabilityRepository } from "./probabilityRepository.js";
import { computeProbabilityForMatch } from "../domain/probability/computeProbabilityForMatch.js";
import { computeSimulatedProbabilities } from "../domain/probability/computeSimulatedProbabilities.js";
import {
  computeGroupStandings,
  generateGroupMatches,
  getSimulatorGroups,
  isGroupComplete,
} from "../domain/simulator/standings.js";
import { buildTeamPaths, getTournamentPaths } from "../domain/tournament/buildTeamPaths.js";

export const defaultServices = {
  probabilityRepository: defaultProbabilityRepository,
  probabilityEngine: {
    computeProbabilityForMatch,
  },
  simulatorEngine: {
    computeSimulatedProbabilities,
    computeGroupStandings,
    generateGroupMatches,
    getSimulatorGroups,
    isGroupComplete,
  },
  pathBuilder: {
    buildTeamPaths,
    getTournamentPaths,
  },
};

const ServicesContext = createContext(defaultServices);

export function ServicesProvider({ children, services }) {
  const value = useMemo(
    () => ({
      ...defaultServices,
      ...services,
      probabilityEngine: {
        ...defaultServices.probabilityEngine,
        ...(services?.probabilityEngine ?? {}),
      },
      simulatorEngine: {
        ...defaultServices.simulatorEngine,
        ...(services?.simulatorEngine ?? {}),
      },
      pathBuilder: {
        ...defaultServices.pathBuilder,
        ...(services?.pathBuilder ?? {}),
      },
      probabilityRepository: services?.probabilityRepository ?? defaultServices.probabilityRepository,
    }),
    [services]
  );

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  return useContext(ServicesContext);
}

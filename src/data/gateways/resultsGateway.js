import mockResultsGateway from "./mockResultsGateway.js";

export function createResultsGateway(overrides = {}) {
  return {
    ...mockResultsGateway,
    ...overrides,
  };
}

export const defaultResultsGateway = createResultsGateway();

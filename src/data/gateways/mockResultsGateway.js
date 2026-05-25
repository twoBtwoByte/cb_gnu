export const mockResultsGateway = {
  async getLatestResults() {
    const now = Date.now();
    const simulatedMatchInterval = 90 * 60 * 1000;
    const simulatedMatchesDone = Math.floor((now - Date.UTC(2026, 5, 11)) / simulatedMatchInterval);
    return {
      matchesCompleted: Math.max(0, simulatedMatchesDone),
      adjustments: {},
    };
  },
};

export default mockResultsGateway;

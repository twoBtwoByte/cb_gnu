const DEFAULT_FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const DEFAULT_FOOTBALL_DATA_COMPETITION = "WC";
const DEFAULT_CACHE_CONTROL = "public, max-age=300, s-maxage=300";

const getFootballDataUrl = () => {
  const baseUrl = process.env.FOOTBALL_DATA_API_BASE_URL ?? DEFAULT_FOOTBALL_DATA_BASE_URL;
  const competitionCode =
    process.env.FOOTBALL_DATA_COMPETITION_CODE ?? DEFAULT_FOOTBALL_DATA_COMPETITION;
  return `${baseUrl}/competitions/${competitionCode}/matches?status=FINISHED`;
};

const setCorsHeaders = (response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiToken = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!apiToken) {
    response.status(500).json({ error: "FOOTBALL_DATA_API_TOKEN is not configured" });
    return;
  }

  try {
    const upstreamResponse = await fetch(getFootballDataUrl(), {
      headers: {
        "X-Auth-Token": apiToken,
        "Cache-Control": "no-cache",
      },
    });

    if (!upstreamResponse.ok) {
      response.status(upstreamResponse.status).json({
        error: "Unable to fetch completed matches from upstream API",
      });
      return;
    }

    const payload = await upstreamResponse.json();
    response.setHeader("Cache-Control", DEFAULT_CACHE_CONTROL);
    response.status(200).json(payload);
  } catch {
    response.status(502).json({ error: "Failed to reach upstream API" });
  }
}

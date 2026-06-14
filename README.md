# cb_gnu

## Completed match score backend

Schedule Explorer now fetches completed match data from a backend endpoint instead of calling
`api.football-data.org` directly from the browser.

- Frontend endpoint config: `VITE_COMPLETED_MATCHES_BACKEND_URL` (defaults to `/api/completed-matches`)
- Backend token config: `FOOTBALL_DATA_API_TOKEN`
- Optional backend overrides:
  - `FOOTBALL_DATA_API_BASE_URL` (default `https://api.football-data.org/v4`)
  - `FOOTBALL_DATA_COMPETITION_CODE` (default `WC`)

The repository includes a serverless handler at
`/home/runner/work/cb_gnu/cb_gnu/twoBtwoByte/cb_gnu/api/completed-matches.js`.
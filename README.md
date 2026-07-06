# World Cup 2026 Match Planner

A streamlined web application for exploring the FIFA World Cup 2026 schedule and tracking match probabilities.

## Features

- **Schedule Explorer**: Browse and filter the complete World Cup 2026 match schedule
- **Country & Venue Filters**: Find matches by your favorite teams or host cities
- **Match Probabilities**: See which teams are likely to appear in knockout matches
- **Live Results**: Automatically updated completed match scores

## Project Structure

```
src/
├── components/          # React components
│   ├── ScheduleExplorerApp.jsx
│   └── ScheduleExplorerApp.css
├── utils/              # Utility functions
│   ├── scheduleExplorerUtils.js
│   └── knockoutEngine.js
├── config/             # Configuration
│   ├── scheduleExplorerConfig.js
│   └── eliminatedTeams.js
├── tests/              # Test files
│   ├── ScheduleExplorerApp.test.jsx
│   └── scheduleExplorerUtils.test.js
└── index.jsx           # Entry point
```

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Running Tests

```bash
npm test
```

## Data Sources

- **Schedule Data**: `public/data/worldCup2026Schedule.json`
- **Completed Results**: `public/data/completedMatchResults.json` (auto-updated via GitHub Actions)

## Fetching Latest Match Results

Match results are automatically fetched and committed via GitHub Actions workflow (`.github/workflows/update-match-results.yml`).

To manually fetch results:

```bash
npm run fetch-results
```

**Environment Variable**: `VITE_FOOTBALL_DATA_API_TOKEN` (required for `npm run fetch-results`)

## Tech Stack

- React 18
- Vite 8
- Vitest for testing
- GitHub Pages for hosting


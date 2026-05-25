import { TEAM_DATA } from "../../config/worldCupConfig.js";

export function getSimulatorGroups(bracket) {
  const groups = new Set();

  for (const slot of Object.values(bracket ?? {})) {
    if (slot?.sideA?.group) groups.add(slot.sideA.group);
    if (slot?.sideB?.group) groups.add(slot.sideB.group);

    if (!slot?.hostTeamSlot && slot?.sideB?.thirdPlace && Array.isArray(slot.sideB.eligibleGroups)) {
      slot.sideB.eligibleGroups.forEach((group) => groups.add(group));
    }
  }

  return [...groups].sort();
}

export function generateGroupMatches(groups) {
  const matches = [];

  for (const group of groups) {
    const teams = TEAM_DATA.filter((team) => team.group === group);
    for (let i = 0; i < teams.length; i += 1) {
      for (let j = i + 1; j < teams.length; j += 1) {
        matches.push({
          key: `${group}-${teams[i].code}-${teams[j].code}`,
          group,
          homeTeam: teams[i],
          awayTeam: teams[j],
        });
      }
    }
  }

  return matches;
}

function isValidScore(value) {
  return value !== "" && value != null && !Number.isNaN(parseInt(value, 10));
}

export function isGroupComplete(group, results) {
  const teams = TEAM_DATA.filter((team) => team.group === group);
  const totalMatches = (teams.length * (teams.length - 1)) / 2;
  let played = 0;

  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      const key = `${group}-${teams[i].code}-${teams[j].code}`;
      const result = results[key];
      if (result && isValidScore(result.homeScore) && isValidScore(result.awayScore)) {
        played += 1;
      }
    }
  }

  return played === totalMatches;
}

export function computeGroupStandings(group, results) {
  const teams = TEAM_DATA.filter((team) => team.group === group);
  const rows = {};

  teams.forEach((team) => {
    rows[team.code] = {
      ...team,
      pts: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      played: 0,
    };
  });

  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      const key = `${group}-${teams[i].code}-${teams[j].code}`;
      const result = results[key];
      if (!result || !isValidScore(result.homeScore) || !isValidScore(result.awayScore)) {
        continue;
      }

      const homeGoals = parseInt(result.homeScore, 10);
      const awayGoals = parseInt(result.awayScore, 10);
      if (Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) continue;

      const home = rows[teams[i].code];
      const away = rows[teams[j].code];

      home.gf += homeGoals;
      home.ga += awayGoals;
      home.gd += homeGoals - awayGoals;
      home.played += 1;

      away.gf += awayGoals;
      away.ga += homeGoals;
      away.gd += awayGoals - homeGoals;
      away.played += 1;

      if (homeGoals > awayGoals) {
        home.pts += 3;
        home.w += 1;
        away.l += 1;
      } else if (homeGoals < awayGoals) {
        away.pts += 3;
        away.w += 1;
        home.l += 1;
      } else {
        home.pts += 1;
        away.pts += 1;
        home.d += 1;
        away.d += 1;
      }
    }
  }

  return Object.values(rows).sort((a, b) =>
    b.pts !== a.pts
      ? b.pts - a.pts
      : b.gd !== a.gd
        ? b.gd - a.gd
        : b.gf !== a.gf
          ? b.gf - a.gf
          : a.name.localeCompare(b.name)
  );
}

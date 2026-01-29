import { cacheLife } from 'next/cache';

interface WNBATeamStanding {
  id: string;
  rank: number;
  name: string;
  wins: number;
  losses: number;
  winPct: string;
  logo?: string;
}

async function fetchStandingsForYear(year: number): Promise<WNBATeamStanding[]> {
  const response = await fetch(
    `https://site.web.api.espn.com/apis/v2/sports/basketball/wnba/standings?region=us&lang=en&contentorigin=espn&type=0&level=1&sort=winpercent:desc&season=${year}&startingseason=2007`
  );
  const data = await response.json();

  if (!data?.standings?.entries) {
    return [];
  }

  return data.standings.entries.map((entry: any) => {
    const stats = entry.stats.reduce((acc: any, stat: any) => {
      acc[stat.name] = stat;
      return acc;
    }, {});

    return {
      id: entry.team.id,
      rank: entry.playoffSeed || 0,
      name: entry.team.displayName,
      wins: stats.wins?.value || 0,
      losses: stats.losses?.value || 0,
      winPct: stats.winPercent?.displayValue || '0.000',
      logo: entry.team.logos?.[0]?.href,
    };
  });
}

export async function fetchWNBAStandings(): Promise<{ standings: WNBATeamStanding[]; season: number }> {
  'use cache';
  cacheLife('minutes');
  const currentYear = new Date().getFullYear();

  // Try current year first
  let standings = await fetchStandingsForYear(currentYear);

  // If no standings found OR all teams have 0-0 record (season hasn't started), fall back to previous year
  const hasNoData = standings.length === 0;
  const allTeamsZeroWins = standings.length > 0 && standings.every((team) => team.wins === 0 && team.losses === 0);

  if (hasNoData || allTeamsZeroWins) {
    standings = await fetchStandingsForYear(currentYear - 1);
    return { standings, season: currentYear - 1 };
  }

  return { standings, season: currentYear };
}

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

async function fetchStandingsForYear(
  year: number,
  seasonType: 0 | 2 = 2,
  zeroRecords = false,
): Promise<WNBATeamStanding[]> {
  const response = await fetch(
    `https://site.web.api.espn.com/apis/v2/sports/basketball/wnba/standings?region=us&lang=en&contentorigin=espn&type=${seasonType}&level=1&sort=winpercent:desc&season=${year}&startingseason=2007`
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
      rank: zeroRecords ? 0 : entry.playoffSeed || 0,
      name: entry.team.displayName,
      wins: zeroRecords ? 0 : stats.wins?.value || 0,
      losses: zeroRecords ? 0 : stats.losses?.value || 0,
      winPct: zeroRecords ? '0.000' : stats.winPercent?.displayValue || '0.000',
      logo: entry.team.logos?.[0]?.href,
    };
  });
}

export async function fetchWNBAStandings(): Promise<{ standings: WNBATeamStanding[]; season: number }> {
  'use cache';
  cacheLife('minutes');
  const currentYear = new Date().getFullYear();

  // Try current year regular-season standings first.
  let standings = await fetchStandingsForYear(currentYear, 2);

  if (standings.length > 0) {
    return { standings, season: currentYear };
  }

  // Regular season hasn't started yet (e.g. preseason). ESPN returns 0 entries for type=2,
  // but type=0 (overall) has the team list with preseason records. Use that for the team
  // list / logos but zero out W/L so we don't display preseason records as standings.
  const overallZeroed = await fetchStandingsForYear(currentYear, 0, true);

  if (overallZeroed.length > 0) {
    return { standings: overallZeroed, season: currentYear };
  }

  // Truly nothing for current year — fall back to previous year's final standings.
  standings = await fetchStandingsForYear(currentYear - 1, 2);
  return { standings, season: currentYear - 1 };
}

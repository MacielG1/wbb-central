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

async function fetchStandingsForYear(year: number, seasonType: 0 | 2 = 2, zeroRecords = false): Promise<WNBATeamStanding[]> {
  const response = await fetch(
    `https://site.web.api.espn.com/apis/v2/sports/basketball/wnba/standings?region=us&lang=en&contentorigin=espn&type=${seasonType}&level=1&sort=winpercent:desc&season=${year}&startingseason=2007`,
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

  // Use type=0 (overall) — this is the real league standings ESPN's page displays.
  // NOTE: type=2 returns the Commissioner's Cup standings (a separate in-season
  // tournament with only a handful of games), NOT the regular-season records.
  const overall = await fetchStandingsForYear(currentYear, 0);
  const overallHasRecords = overall.some((t) => t.wins > 0 || t.losses > 0);

  if (overall.length > 0) {
    if (overallHasRecords) {
      return { standings: overall, season: currentYear };
    }
    // True preseason: zero out records so we don't show preseason data.
    const zeroed = overall.map((t) => ({ ...t, rank: 0, wins: 0, losses: 0, winPct: '0.000' }));
    return { standings: zeroed, season: currentYear };
  }

  // Truly nothing for current year — fall back to previous year's final standings.
  const prev = await fetchStandingsForYear(currentYear - 1, 0);
  return { standings: prev, season: currentYear - 1 };
}

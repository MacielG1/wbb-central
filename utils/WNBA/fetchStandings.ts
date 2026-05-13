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

  // Try current year regular-season standings first.
  const regularSeason = await fetchStandingsForYear(currentYear, 2);
  const hasRecords = regularSeason.some((t) => t.wins > 0 || t.losses > 0);

  if (regularSeason.length > 0 && hasRecords) {
    return { standings: regularSeason, season: currentYear };
  }

  // Regular season hasn't started, OR ESPN's regular-season endpoint is returning
  // all-zero records (known delay early in the season). Fall back to type=0 (overall)
  // which mirrors what ESPN's standings page actually displays. If regular season truly
  // hasn't started (no team has any wins/losses), zero out so we don't show preseason.
  const overall = await fetchStandingsForYear(currentYear, 0);
  const overallHasRecords = overall.some((t) => t.wins > 0 || t.losses > 0);

  if (overall.length > 0) {
    if (regularSeason.length > 0 && !hasRecords && overallHasRecords) {
      return { standings: overall, season: currentYear };
    }
    const zeroed = overall.map((t) => ({ ...t, rank: 0, wins: 0, losses: 0, winPct: '0.000' }));
    return { standings: zeroed, season: currentYear };
  }

  // Truly nothing for current year — fall back to previous year's final standings.
  const prev = await fetchStandingsForYear(currentYear - 1, 2);
  return { standings: prev, season: currentYear - 1 };
}

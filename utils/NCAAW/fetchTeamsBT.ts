'use server';
import { unstable_cacheLife } from 'next/cache';

interface TeamStats {
  team: string;
  adjOffensiveEfficiency: number;
  adjDefensiveEfficiency: number;
  barthag: number;
  wins: number;
  Record: string;
  games: number;
  effectiveFieldGoalPct: number;
  defEffectiveFieldGoalPct: number;
  freeThrowRate: number;
  defFreeThrowRate: number;
  turnoverRate: number;
  defTurnoverRate: number;
  offensiveReboundRate: number;
  defensiveReboundRate: number;
  twoPtPct: number;
  defTwoPtPct: number;
  threePtPct: number;
  defThreePtPct: number;
  blockRate: number;
  blockRateAllowed: number;
  assistRate: number;
  defAssistRate: number;
  threeFgRate: number;
  defThreeFgRate: number;
  adjustedTempo: number;
  winsAboveBubble: number;
  freeThrowPct: number;
  defFreeThrowPct: number;
  season: number;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  const headers: HeadersInit = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
    Accept: 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(options.headers as Record<string, string>),
  };
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed to fetch after all retries');
}

function formatBTTeamData(team: any[], year: number): TeamStats {
  return {
    team: team[0],
    adjOffensiveEfficiency: team[1],
    adjDefensiveEfficiency: team[2],
    barthag: team[3],
    Record: team[4],
    wins: team[5],
    games: team[6],
    effectiveFieldGoalPct: team[7],
    defEffectiveFieldGoalPct: team[8],
    freeThrowRate: team[9],
    defFreeThrowRate: team[10],
    turnoverRate: team[11],
    defTurnoverRate: team[12],
    offensiveReboundRate: team[13],
    defensiveReboundRate: team[14],
    twoPtPct: team[16],
    defTwoPtPct: team[17],
    threePtPct: team[18],
    defThreePtPct: team[19],
    blockRate: team[20],
    blockRateAllowed: team[21],
    assistRate: team[22],
    defAssistRate: team[23],
    threeFgRate: team[24],
    defThreeFgRate: team[25],
    adjustedTempo: team[26],
    winsAboveBubble: team[34],
    freeThrowPct: team[35],
    defFreeThrowPct: team[36],
    season: year,
  };
}

export async function fetchTeamsStatsBT(year?: number, seasonType: string = 'Regular Season') {
  'use cache';
  unstable_cacheLife('minutes');

  // If year is not provided, use current year
  const currentYear = new Date().getFullYear();
  const yearToUse = year || currentYear;

  const url = `${process.env.NCAAW_fetchTeamsBT}?year=${yearToUse}&json=1`;

  try {
    const response = await fetchWithRetry(url, {
      next: { revalidate: 60 },
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.warn(
        `[fetchTeamsStatsBT] Non-JSON response for year ${yearToUse}. Status ${response.status}. First 200 chars: ${text.substring(0, 200)}`
      );
      return [];
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (e) {
      console.warn(`[fetchTeamsStatsBT] Failed to parse JSON for year ${yearToUse}.`, e);
      return [];
    }

    if (!Array.isArray(data)) {
      console.warn(`API returned non-array data for year ${yearToUse}:`, data);
      return [];
    }

    const formattedData = data.map((team: any) => formatBTTeamData(team, yearToUse));

    return formattedData;
  } catch (error) {
    console.warn(`Error fetching team data for year ${yearToUse}:`, error);

    return [];
  }
}

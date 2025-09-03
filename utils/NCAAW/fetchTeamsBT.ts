'use server';
import { unstable_cacheLife as cacheLife } from 'next/cache';

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

async function fetchWithVerification(url: string): Promise<Response> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    Connection: 'keep-alive',
    Cookie: 'js_verified=true',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
  };

  return await fetch(url, { headers });
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithVerification(url);
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
  cacheLife('minutes');

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const defaultStartYear = m >= 10 ? y : y - 1;
  const startYear = year ?? defaultStartYear;
  const apiYear = startYear + 1;

  const url = `${process.env.NCAAW_fetchTeamsBT}?year=${apiYear}&json=1`;

  try {
    const response = await fetchWithRetry(url);

    let data: unknown;
    try {
      data = await response.json();
    } catch (e) {
      console.warn(`[fetchTeamsStatsBT] Failed to parse JSON for start-year ${startYear}.`, e);
      return [];
    }

    if (!Array.isArray(data)) {
      console.warn(`API returned non-array data for start-year ${startYear}:`, data);
      return [];
    }

    const formattedData = data.map((team: any) => formatBTTeamData(team, startYear));

    return formattedData;
  } catch (error) {
    console.warn(`Error fetching team data for start-year ${startYear}:`, error);

    return [];
  }
}

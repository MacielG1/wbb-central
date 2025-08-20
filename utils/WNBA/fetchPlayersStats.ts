'use server';
import { unstable_cacheLife } from 'next/cache';

async function fetchWithRetry(url: string, maxRetries = 3, timeoutMs = 10000): Promise<Response> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    Referer: `${process.env.WNBA_fetchPlayersStats}`,
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`[fetchWithRetry] Timeout after ${timeoutMs}ms on attempt ${attempt} for URL: ${url}`);
      } else {
      }
      if (attempt === maxRetries) {
        console.error(`[fetchWithRetry] All ${maxRetries} attempts failed for URL: ${url}`);
        throw error;
      }
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`[fetchWithRetry] Retrying after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed to fetch after all retries');
}

export interface WNBAPlayerStats {
  playerName: string;
  team: string;
  position: string;
  gamesPlayed: number;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  threePointFieldGoalsMade: number;
  threePointFieldGoalsAttempted: number;
  threePointPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  fg3Made: number;
  fg3Attempted: number;
  fg3Percentage: number;
  fgMade: number;
  fgAttempted: number;
  fgPercentage: number;
  ftMade: number;
  ftAttempted: number;
  ftPercentage: number;
  season?: number;
  playerId: string;
  url: string;
}

export async function fetchWNBAPlayerStats(season: number = new Date().getFullYear()): Promise<WNBAPlayerStats[]> {
  'use cache';
  unstable_cacheLife('minutes');

  const url = `${process.env.WNBA_fetchPlayersStats}wnba/tables/stats.php?statType=pergame&season=${season}`;

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('[fetchWNBAPlayerStats] Invalid data format from Rotowire API:', data);
      return [];
    }

    const formattedData: WNBAPlayerStats[] = data.map((player: any) => ({
      playerName: decodeHtmlEntities(player.player),
      team: player.team,
      position: player.position,
      gamesPlayed: parseFloat(player.games),
      minutes: parseFloat(player.minutes),
      points: parseFloat(player.pts),
      rebounds: parseFloat(player.reb),
      assists: parseFloat(player.asists),
      steals: parseFloat(player.steals),
      blocks: parseFloat(player.blocks),
      turnovers: parseFloat(player.to),
      offensiveRebounds: parseFloat(player.oreb),
      defensiveRebounds: parseFloat(player.dreb),
      fieldGoalsMade: parseFloat(player.fgm),
      fieldGoalsAttempted: parseFloat(player.fga),
      fieldGoalPercentage: parseFloat(player.fgpct) / 100,
      threePointFieldGoalsMade: parseFloat(player['3pm']),
      threePointFieldGoalsAttempted: parseFloat(player['3pa']),
      threePointPercentage: parseFloat(player['3ppct']) / 100,
      freeThrowsMade: parseFloat(player.ftm),
      freeThrowsAttempted: parseFloat(player.fta),
      freeThrowPercentage: parseFloat(player.ftpct) / 100,
      fg3Made: parseFloat(player['3pm']),
      fg3Attempted: parseFloat(player['3pa']),
      fg3Percentage: parseFloat(player['3ppct']) / 100,
      fgMade: parseFloat(player.fgm),
      fgAttempted: parseFloat(player.fga),
      fgPercentage: parseFloat(player.fgpct) / 100,
      ftMade: parseFloat(player.ftm),
      ftAttempted: parseFloat(player.fta),
      ftPercentage: parseFloat(player.ftpct) / 100,
      season,
      playerId: player.PlayerID,
      url: player.URL,
    }));
    return formattedData;
  } catch (error) {
    console.error(`[fetchWNBAPlayerStats] Error fetching WNBA player stats for season ${season}:`, error);
    return [];
  }
}

function decodeHtmlEntities(text: string): string {
  const decoded = text.replace(/&#(\d+);/g, (match, dec) => {
    try {
      return String.fromCharCode(parseInt(dec, 10));
    } catch (e) {
      return match;
    }
  });

  const entities: { [key: string]: string } = {
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
  };

  return decoded.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

'use server';
import { unstable_cacheLife as usecache } from 'next/cache';

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
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

export interface WNBAPlayerStats {
  playerId: number;
  rank: number;
  playerName: string;
  teamId: number;
  team: string;
  gamesPlayed: number;
  minutes: number;
  fgMade: number;
  fgAttempted: number;
  fgPercentage: number;
  fg3Made: number;
  fg3Attempted: number;
  fg3Percentage: number;
  ftMade: number;
  ftAttempted: number;
  ftPercentage: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  points: number;
  efficiency: number;
  season: number;
}

export async function fetchWNBAPlayerStats(season: number = new Date().getFullYear(), seasonType: string = 'Regular Season'): Promise<WNBAPlayerStats[]> {
  'use cache';
  usecache('hours');

  const url = `https://stats.wnba.com/stats/leagueLeaders?LeagueID=10&PerMode=PerGame&Scope=S&Season=${season}&SeasonType=${encodeURIComponent(seasonType)}&StatCategory=PTS`;

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();

    // Ensure we have valid data
    if (!data || !data.resultSet || !data.resultSet.rowSet) {
      console.error('Invalid data format from WNBA API:', data);
      return [];
    }

    // Handle empty rowSet (no data for the season)
    if (!Array.isArray(data.resultSet.rowSet) || data.resultSet.rowSet.length === 0) {
      console.log(`No player stats available for WNBA season ${season}`);
      return [];
    }

    // Map API data to our interface
    const formattedData: WNBAPlayerStats[] = data.resultSet.rowSet.map((player: any[]) => ({
      playerId: player[0],
      rank: player[1],
      playerName: player[2],
      teamId: player[3],
      team: player[4],
      gamesPlayed: player[5],
      minutes: player[6],
      fgMade: player[7],
      fgAttempted: player[8],
      fgPercentage: player[9],
      fg3Made: player[10],
      fg3Attempted: player[11],
      fg3Percentage: player[12],
      ftMade: player[13],
      ftAttempted: player[14],
      ftPercentage: player[15],
      offensiveRebounds: player[16],
      defensiveRebounds: player[17],
      rebounds: player[18],
      assists: player[19],
      steals: player[20],
      blocks: player[21],
      turnovers: player[22],
      points: player[23],
      efficiency: player[24],
      season: season,
    }));

    return formattedData;
  } catch (error) {
    console.error(`Error fetching WNBA player stats for season ${season}:`, error);
    return [];
  }
}

'use server';
import { unstable_cacheLife } from 'next/cache';

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  const headers = {
    'Host': 'stats.wnba.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'x-nba-stats-origin': 'stats',
    'x-nba-stats-token': 'true',
    'Connection': 'keep-alive',
    'Origin': 'https://stats.wnba.com',
    'Referer': 'https://www.wnba.com/',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache'
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { headers });
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
  nickname: string;
  teamId: number;
  team: string;
  age: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
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
  turnovers: number;
  steals: number;
  blocks: number;
  blocksAgainst: number;
  personalFouls: number;
  personalFoulsDrawn: number;
  points: number;
  plusMinus: number;
  nbaFantasyPts: number;
  doubleDoubles: number;
  tripleDoubles: number;
  wnbaFantasyPts: number;
  season: number;
}

export async function fetchWNBAPlayerStats(season: number = new Date().getFullYear(), seasonType: string = 'Regular Season'): Promise<WNBAPlayerStats[]> {
  'use cache';
  unstable_cacheLife('minutes');

  const url = `${process.env.WNBA_fetchPlayersStats}?College=&Conference=&Country=&DateFrom=&DateTo=&Division=&DraftPick=&DraftYear=&GameScope=&GameSegment=&Height=&LastNGames=0&LeagueID=10&Location=&MeasureType=Base&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=${season}&SeasonSegment=&SeasonType=${encodeURIComponent(seasonType)}&ShotClockRange=&StarterBench=&TeamID=0&TwoWay=0&VsConference=&VsDivision=&Weight=`

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();

    // Ensure we have valid data with new resultSets format
    if (!data || !data.resultSets || !data.resultSets[0]?.rowSet) {
      console.error('Invalid data format from WNBA API:', data);
      return [];
    }

    // Handle empty rowSet (no data for the season)
    if (!Array.isArray(data.resultSets[0].rowSet) || data.resultSets[0].rowSet.length === 0) {
      console.log(`No player stats available for WNBA season ${season}`);
      return [];
    }

    const formattedData: WNBAPlayerStats[] = data.resultSets[0].rowSet.map((player: any[], index: number) => ({
      playerId: player[0],
      rank: index + 1,
      playerName: player[1],
      nickname: player[2],
      teamId: player[3],
      team: player[4],
      age: player[5],
      gamesPlayed: player[6],
      wins: player[7],
      losses: player[8],
      winPct: player[9],
      minutes: player[10],
      fgMade: player[11],
      fgAttempted: player[12],
      fgPercentage: player[13],
      fg3Made: player[14],
      fg3Attempted: player[15],
      fg3Percentage: player[16],
      ftMade: player[17],
      ftAttempted: player[18],
      ftPercentage: player[19],
      offensiveRebounds: player[20],
      defensiveRebounds: player[21],
      rebounds: player[22],
      assists: player[23],
      turnovers: player[24],
      steals: player[25],
      blocks: player[26],
      blocksAgainst: player[27],
      personalFouls: player[28],
      personalFoulsDrawn: player[29],
      points: player[30],
      plusMinus: player[31],
      nbaFantasyPts: player[32],
      doubleDoubles: player[33],
      tripleDoubles: player[34],
      wnbaFantasyPts: player[35],
      season: season,
    }));

    return formattedData;
  } catch (error) {
    console.error(`Error fetching WNBA player stats for season ${season}:`, error);
    return [];
  }
}

"use server"
import { unstable_cacheLife } from 'next/cache';

export interface WNBATeamStats {
  teamId: string;
  teamName: string;
  teamAbbr?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  minutes: number;
  points: number;
  fgMade: number;
  fgAttempted: number;
  fgPct: number;
  fg3Made: number;
  fg3Attempted: number;
  fg3Pct: number;
  ftMade: number;
  ftAttempted: number;
  ftPct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  pf: number;
  plusMinus: number;
  season: number;
}

// Team name to abbreviation mapping
const teamNameToAbbr: Record<string, string> = {
  "Atlanta Dream": "ATL",
  "Chicago Sky": "CHI",
  "Connecticut Sun": "CON",
  "Dallas Wings": "DAL",
  "Las Vegas Aces": "LV",
  "Los Angeles Sparks": "LA",
  "Minnesota Lynx": "MIN",
  "New York Liberty": "NY",
  "Phoenix Mercury": "PHX",
  "Seattle Storm": "SEA",
  "Washington Mystics": "WAS",
  "Indiana Fever": "IND",
};

export async function fetchWNBAteamStats(season: number = new Date().getFullYear(), seasonType: string = "Regular Season"): Promise<WNBATeamStats[]> {
  'use cache';
  unstable_cacheLife('minutes');

  const url = `https://stats.wnba.com/stats/leaguedashteamstats?Conference=&DateFrom=&DateTo=&Division=&GameScope=&GameSegment=&LastNGames=0&LeagueID=10&Location=&MeasureType=Base&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=${season}&SeasonSegment=&SeasonType=${encodeURIComponent(seasonType)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Referer": "https://stats.wnba.com/teams/traditional/?sort=W_PCT&dir=-1&Season=2023&SeasonType=Regular%20Season",
        "X-NewRelic-ID": "VQECWF5UChAHUlNTBwgBVw==",
        "x-nba-stats-origin": "stats",
        "x-nba-stats-token": "true",
        "DNT": "1",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
      }
    });
    const data = await response.json();

    if (!data || !data.resultSets || !data.resultSets[0] || !data.resultSets[0].rowSet) {
      console.error('Invalid data format from WNBA Team Stats API:', data);
      return [];
    }

    const headers = data.resultSets[0].headers;
    const rows = data.resultSets[0].rowSet;

    return rows.map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, i: number) => {
        obj[header] = row[i];
      });
      return {
        teamId: obj.TEAM_ID,
        teamName: obj.TEAM_NAME,
        teamAbbr: teamNameToAbbr[obj.TEAM_NAME],
        gamesPlayed: obj.GP,
        wins: obj.W,
        losses: obj.L,
        winPct: obj.W_PCT,
        minutes: obj.MIN,
        points: obj.PTS,
        fgMade: obj.FGM,
        fgAttempted: obj.FGA,
        fgPct: obj.FG_PCT,
        fg3Made: obj.FG3M,
        fg3Attempted: obj.FG3A,
        fg3Pct: obj.FG3_PCT,
        ftMade: obj.FTM,
        ftAttempted: obj.FTA,
        ftPct: obj.FT_PCT,
        oreb: obj.OREB,
        dreb: obj.DREB,
        reb: obj.REB,
        ast: obj.AST,
        tov: obj.TOV,
        stl: obj.STL,
        blk: obj.BLK,
        pf: obj.PF,
        plusMinus: obj.PLUS_MINUS,
        season: season,
      };
    });
  } catch (error) {
    console.error(`Error fetching WNBA team stats for season ${season}:`, error);
    return [];
  }
} 
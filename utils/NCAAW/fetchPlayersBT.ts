'use server';
import { unstable_cacheLife as cacheLife } from 'next/cache';

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  const headers: HeadersInit = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
    Accept: 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
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

export async function fetchPlayersStatsBT(year?: number) {
  'use cache';
  cacheLife('minutes');

  // If year is not provided, use current year
  const currentYear = new Date().getFullYear();
  const yearToUse = year || currentYear;

  const url = `${process.env.NCAAW_fetchPlayersBT}?year=${yearToUse}&top=400&page=playerstat`;

  try {
    const response = await fetchWithRetry(url);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.warn(
        `[fetchPlayersStatsBT] Non-JSON response for year ${yearToUse}. Status ${response.status}. First 200 chars: ${text.substring(0, 200)}`
      );
      return [];
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (e) {
      console.warn(`[fetchPlayersStatsBT] Failed to parse JSON for year ${yearToUse}.`, e);
      return [];
    }

    if (!Array.isArray(data)) {
      console.warn(`API returned non-array data for year ${yearToUse}:`, data);
      return [];
    }

    const formattedData = data.map((player: any) => formatBTData(player, yearToUse));

    return formattedData;
  } catch (error) {
    console.warn(`Error fetching data for year ${yearToUse}:`, error);

    return [];
  }
}

function formatBTData(player: any, year: number) {
  return {
    playerName: player[0],
    team: player[1],
    conference: player[2],
    gamesPlayed: player[3],
    minutesPercentage: player[4],
    offensiveRating: player[5],
    usage: player[6],
    effectiveFGPercentage: player[7],
    trueShootingPercentage: player[8],
    offensiveReboundPercentage: player[9],
    defensiveReboundPercentage: player[10],
    assistPercentage: player[11],
    turnoverPercentage: player[12],
    freeThrowsMade: player[13],
    freeThrowsAttempted: player[14],
    freeThrowPercentage: player[15],
    twoPMade: player[16],
    twoPAttempted: player[17],
    twoPPercentage: player[18],
    threePMade: player[19],
    threePAttempted: player[20],
    threePPercentage: player[21],
    blockPercentage: player[22],
    stealPercentage: player[23],
    foulRate: player[24],
    year: player[25],
    height: player[26],
    number: player[27],
    porpag: player[28],
    adjoe: player[29],
    foulsPer40: player[30],
    season: year,
    hometown: player[33],
    recruitRank: player[34],
    assistToTurnover: player[35],
    rimMakes: player[36],
    rimAttempts: player[37],
    midRangeMakes: player[38],
    midRangeAttempts: player[39],
    rimPercentage: player[40],
    midRangePercentage: player[41],
    defensiveRating: player[46],
    adjustedDefensiveRating: player[47],
    defensivePorpag: player[48],
    stops: player[49],
    boxPlusMinus: player[50],
    offensiveBoxPlusMinus: player[51],
    defensiveBoxPlusMinus: player[52],
    gameBoxPlusMinus: player[53],
    minutesPerGame: player[54],
    offensiveGameBoxPlusMinus: player[55],
    defensiveGameBoxPlusMinus: player[56],
    offensiveRebounds: player[57],
    defensiveRebounds: player[58],
    totalRebounds: player[59],
    assists: player[60],
    steals: player[61],
    blocks: player[62],
    points: player[63],
    role: player[64],
    threePPer100: player[65],
  };
}

// Example usage
// retrieveBtStats(2025).then((stats) => console.log(stats));

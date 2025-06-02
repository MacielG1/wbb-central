import * as cheerio from 'cheerio';
import { unstable_cacheLife as cacheLife } from 'next/cache';

export type TeamRanking = {
  rank: number;
  name: string;
  record: string;
};

export type NetRankingsResponse = {
  rankings: TeamRanking[];
  lastUpdated: string;
};

export async function fetchNetRankings(): Promise<NetRankingsResponse> {
  'use cache';
  cacheLife('minutes');

  async function attemptFetch() {
    const response = await fetch(`${process.env.NCAAW_fetchNetRankings}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rankings');
    }

    return response;
  }

  try {
    let response;
    try {
      response = await attemptFetch();
    } catch (error) {
      response = await attemptFetch();
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const rankings: TeamRanking[] = [];
    const lastUpdated = $('.rankings-last-updated').text().trim();

    // Parse each team row
    $('.rankings-content tbody tr').each((_, element) => {
      const rank = parseInt($(element).find('td:first-child').text(), 10);
      // name is the third td
      const name = $(element).find('td:nth-child(3)').text().trim();
      const record = $(element).find('td:nth-child(5)').text().trim();
      if (rank && name) {
        rankings.push({
          rank,
          name,
          record,
        });
      }
    });

    return {
      rankings,
      lastUpdated,
    };
  } catch (error) {
    console.error('Error fetching BT rankings:', error);
    return {
      rankings: [],
      lastUpdated: '',
    };
  }
}

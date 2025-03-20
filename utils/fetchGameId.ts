import { unstable_cacheLife as cacheLife } from 'next/cache';

export default async function fetchGameId(gameId: string) {
  'use cache';
  cacheLife('seconds');

  async function attemptFetch() {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/summary?event=${gameId}&enable=stats,rankings,odds,linescores,logos,boxscore,plays,leaders`
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch team schedule: ${res.statusText}`);
    }

    return res;
  }

  try {
    let res;
    try {
      res = await attemptFetch();
    } catch (error) {
      res = await attemptFetch();
    }

    const data = await res.json();

    return data;
  } catch (error) {
    console.error('Error fetching team schedule:', error);
    return { error: `Failed to fetch team schedule: ${error}` };
  }
}

// For testing
// fetchGameId('401713514');

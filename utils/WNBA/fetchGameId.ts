import { cacheLife } from 'next/cache';

export default async function fetchWNBAGameId(gameId: string) {
  'use cache';
  cacheLife('minutes');

  async function attemptFetch() {
    const res = await fetch(`${process.env.WNBA_fetchGameId}?event=${gameId}&enable=stats,rankings,odds,linescores,logos,boxscore,plays,leaders`);
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
// fetchWNBAGameId('401765029');

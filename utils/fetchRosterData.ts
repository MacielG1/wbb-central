import { unstable_cacheLife as cacheLife } from 'next/cache';

export default async function fetchRosterData(teamId: string) {
  'use cache';
  cacheLife('hours');

  async function attemptFetch() {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/${teamId}/athletes/statistics`, {
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch roster data: ${res.statusText}`);
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
    console.error('Error fetching roster data:', error);
    return { error: `Failed to fetch roster data: ${error}` };
  }
}

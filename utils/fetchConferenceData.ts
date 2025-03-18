import { unstable_cacheLife as cacheLife } from 'next/cache';

export async function fetchConferenceData(conferenceId: string) {
  'use cache';
  cacheLife('hours');

  async function attemptFetch() {
    const res = await fetch(`https://site.web.api.espn.com/apis/v2/sports/basketball/womens-college-basketball/standings?limit=500&group=${conferenceId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch conference data: ${res.statusText}`);
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
  } catch (error: any) {
    console.error('Error fetching conference data:', error.message);
  }
}

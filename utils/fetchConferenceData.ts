import { unstable_cacheLife as cacheLife } from 'next/cache';

export async function fetchConferenceData(conferenceId: string) {
  'use cache';
  cacheLife('hours');

  async function attemptFetch() {
    const res = await fetch(`${process.env.FETCH_CONFERENCE_DATA_URL}?limit=500&group=${conferenceId}`);
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

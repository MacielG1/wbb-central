import { cacheLife } from 'next/cache';

export default async function fetchRosterData(teamId: string) {
  'use cache';
  cacheLife('minutes');

  async function attemptFetch() {
    const res = await fetch(`${process.env.NCAAW_fetchRosterData}/${teamId}/athletes/statistics`, {
      // cache: 'no-store',
      // next: {
      //   // revalidate: 3600,
      //   tags: [`team-${teamId}-roster`],
      // },
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

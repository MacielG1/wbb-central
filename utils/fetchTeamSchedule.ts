import { unstable_cacheLife as cacheLife } from 'next/cache';

export default async function fetchTeamSchedule(teamId: string) {
  'use cache';
  cacheLife('hours');

  async function attemptFetch() {
    const res = await fetch(`${process.env.FETCH_TEAM_SCHEDULE_URL}/${teamId}/schedule`);
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

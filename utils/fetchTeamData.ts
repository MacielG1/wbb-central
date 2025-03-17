
"use server"
import { unstable_cacheLife as cacheLife } from 'next/cache';

export default async function fetchTeamData(teamId: string) {
  'use cache';
  cacheLife('minutes');

  async function attemptFetch() {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/${teamId}`, {
      cache: 'no-store',
      next: {
        // revalidate: 3600,
        tags: [`team-${teamId}-schedule`],
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
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
    console.error('Error fetching team data:', error);
  }
}

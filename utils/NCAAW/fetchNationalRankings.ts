// import { revalidateTag } from 'next/cache';
import { unstable_cacheLife as cacheLife } from 'next/cache';

export default async function fetchNationalRankings() {
  'use cache';
  cacheLife('hours');

  async function attemptFetch() {
    const res = await fetch(`${process.env.NCAAW_fetchNationalRankings}`, {});
    if (!res.ok) {
      throw new Error(`Failed to fetch national rankings: ${res.statusText}`, { cause: res });
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
    console.error('Error fetching national rankings:', error);
    throw error;
  }
}

'use server';

import fetchNationalRankings from '@/utils/NCAAW/fetchNationalRankings';
import { fetchNetRankings } from '@/utils/NCAAW/fetchNetRankings';
import RankingsDisplay from './RankingsDisplay';
import NCAAWNetRank from './NCAAWNetRank';

export default async function NationalRankings() {
  const [nationalRankings, { rankings: netRankings, lastUpdated }] = await Promise.all([fetchNationalRankings(), fetchNetRankings()]);

  return (
    <RankingsDisplay
      rankings={nationalRankings.rankings}
      netRank={<NCAAWNetRank rankings={netRankings} lastUpdated={lastUpdated} />}
      hasNetRankings={netRankings && netRankings.length > 0}
    />
  );
}

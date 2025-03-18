'use server';

import fetchNationalRankings from '@/utils/fetchNationalRankings';
import { fetchNetRankings } from '@/utils/fetchNetRankings';
import RankingsDisplay from './RankingsDisplay';
import NCAAWNetRank from './NCAAWNetRank';

export default async function NationalRankings() {
  const [nationalRankings, { rankings: netRankings, lastUpdated }] = await Promise.all([fetchNationalRankings(), fetchNetRankings()]);

  return (
    <RankingsDisplay
      rankings={nationalRankings.rankings}
      netRank={<NCAAWNetRank rankings={netRankings} lastUpdated={lastUpdated} />}
    />
  );
}

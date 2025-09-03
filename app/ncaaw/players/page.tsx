import PlayersAdvancedStats from '@/components/Advanced_Stats/PlayersAdvancedStats';
import { fetchPlayersStatsBT } from '@/utils/NCAAW/fetchPlayersBT';
import { Suspense } from 'react';
import { Metadata } from 'next';

export type ParamsType = Promise<{ league: string }>;

export async function generateMetadata(): Promise<Metadata> {

  return {
    title: `NCAAW Basketball - Player Stats`,
    description: `View detailed player statistics and analytics for NCAAW basketball.`,
    openGraph: {
      title: `NCAAW Basketball - Player Statistics`,
      description: `View detailed player statistics and analytics for NCAAW basketball.`,
    },
  };
}

export default async function PlayersPage() {
  const data = await fetchPlayersStatsBT();
  if (!data) {
    return <div>Error loading data</div>;
  }

  return ( 
    <div className="h-[96vh]">
      <Suspense fallback={null}>
        <PlayersAdvancedStats initialData={data} />
      </Suspense>
    </div>
  );
}

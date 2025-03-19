import PlayersAdvancedStats from '@/components/Advanced_Stats/PlayersAdvancedStats';
import { fetchPlayersStatsBT } from '@/utils/fetchPlayersBT';
import { Suspense } from 'react';
import { Metadata } from 'next';

export type ParamsType = Promise<{ league: string }>;

export async function generateMetadata({ params }: { params: ParamsType }): Promise<Metadata> {
  const { league } = await params;
  const leagueName = league.toUpperCase();

  return {
    title: `${leagueName} Basketball - Player Stats`,
    description: `View detailed player statistics and analytics for ${leagueName} basketball.`,
    openGraph: {
      title: `${leagueName} Basketball - Player Statistics`,
      description: `View detailed player statistics and analytics for ${leagueName} basketball.`,
    },
  };
}

export default async function PlayersPage() {
  const currentYear = new Date().getFullYear();

  const data = await fetchPlayersStatsBT(currentYear);
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

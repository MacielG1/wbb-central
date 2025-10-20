import PlayersAdvancedStats from '@/components/Advanced_Stats/PlayersAdvancedStats';
import { fetchPlayersStatsBT } from '@/utils/NCAAW/fetchPlayersBT';
import { Suspense } from 'react';
import { Metadata } from 'next';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

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

export default async function PlayersPage({ searchParams }: Props) {
  const params = await searchParams;
  const yearParam = params.year ? Number(params.year) : undefined;
  const data = await fetchPlayersStatsBT(yearParam);

  return ( 
    <div className="h-[96vh]">
      <Suspense fallback={null}>
        <PlayersAdvancedStats initialData={data} />
      </Suspense>
    </div>
  );
}

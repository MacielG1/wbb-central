import { fetchWNBAPlayerStats } from '@/utils/WNBA/fetchPlayersStats';
import WNBAPlayersStats from '@/components/Advanced_Stats/WNBAPlayersStats';
import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `WNBA Basketball - Player Stats`,
    description: `View detailed player statistics and analytics for WNBA basketball.`,
    openGraph: {
      title: `WNBA Basketball - Player Statistics`,
      description: `View detailed player statistics and analytics for WNBA basketball.`,
    },
  };
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function WNBAPlayerStatsPage({ searchParams }: Props) {
  const currentYear = new Date().getFullYear();
  
  const yearParam = (await searchParams).year;
  const requestedYear = yearParam ? parseInt(yearParam as string, 10) : currentYear;
  
  const data = await fetchWNBAPlayerStats(requestedYear);
  
  return ( 
    <div className="h-[96vh]">
      <Suspense fallback={null}>
        <WNBAPlayersStats initialData={data} />
      </Suspense>
    </div>
  );
} 
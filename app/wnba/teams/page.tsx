import { fetchWNBAteamStats } from '@/utils/WNBA/fetchTeamStats';
import WNBATeamsStats from '@/components/Advanced_Stats/WNBATeamsStats';
import { Suspense } from 'react';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `WNBA Basketball - Team Stats`,
    description: `View detailed team statistics and analytics for WNBA basketball teams.`,
    openGraph: {
      title: `WNBA Basketball - Team Statistics`,
      description: `View detailed team statistics and analytics for WNBA basketball teams.`,
    },
  };
}
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WNBATeamStatsPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const yearParam = params.year;
  const requestedYear = yearParam ? parseInt(yearParam as string, 10) : currentYear;
  const data = await fetchWNBAteamStats(requestedYear);

  return (
    <div className="h-[96vh]">
      <Suspense fallback={null}>
        <WNBATeamsStats initialData={data} />
      </Suspense>
    </div>
  );
}

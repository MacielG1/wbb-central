import { Suspense } from 'react';
import { Metadata } from 'next';
import TeamsAdvancedStats from '@/components/Advanced_Stats/TeamsAdvancedStats';
import { fetchTeamsStatsBT } from '@/utils/fetchTeamsBT';
export type ParamsType = Promise<{ league: string }>;

export async function generateMetadata({ params }: { params: ParamsType }): Promise<Metadata> {
  const { league } = await params;
  const leagueName = league.toUpperCase();

  return {
    title: `${leagueName} Basketball - Teams Stats`,
    description: `View detailed team statistics and analytics for ${leagueName} basketball.`,
    openGraph: {
      title: `${leagueName} Basketball - Teams Stats`,
      description: `View detailed team statistics and analytics for ${leagueName} basketball.`,
    },
  };
}

export default async function TeamsPage() {



  const data = await fetchTeamsStatsBT();
  if (!data) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="h-[96vh]">
      <Suspense fallback={null}>
        <TeamsAdvancedStats initialData={data} />
      </Suspense>
    </div>
  );
}

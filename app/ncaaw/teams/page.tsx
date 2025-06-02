import { Suspense } from 'react';
import { Metadata } from 'next';
import TeamsAdvancedStats from '@/components/Advanced_Stats/TeamsAdvancedStats';
import { fetchTeamsStatsBT } from '@/utils/NCAAW/fetchTeamsBT';
export type ParamsType = Promise<{ league: string }>;

export async function generateMetadata(): Promise<Metadata> {

  return {
    title: `NCAAW Basketball - Teams Stats`,
    description: `View detailed team statistics and analytics for NCAAW basketball.`,
    openGraph: {
      title: `NCAAW Basketball - Teams Stats`,
      description: `View detailed team statistics and analytics for NCAAW basketball.`,
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

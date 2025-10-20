import { Suspense } from 'react';
import WNBATeamSchedule from '@/components/WNBATeamSchedule';
import fetchWNBATeamSchedule from '@/utils/WNBA/fetchTeamSchedule';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import WNBATeamPlayerStats from '@/components/WNBATeamPlayerStats';
import TeamSelector from '@/components/TeamSelector';
import WNBAStandings from '@/components/WNBAStandings';
import FavoriteTeamButton from '@/components/FavoriteTeamButton';
import { fetchWNBATeamIds } from '@/utils/WNBA/fetchTeamIds';
import fetchWNBARosterData from '@/utils/WNBA/fetchRosterData';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Team Details - WNBA Basketball`,
    description: `View team schedule, roster, stats and standings for WNBA basketball.`,
    openGraph: {
      title: `Team Details - WNBA Basketball`,
      description: `View team schedule, roster, stats and standings for WNBA basketball.`,
    },
  };
}

interface PageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function WNBATeamPage({ params }: PageProps) {
  const { teamId } = await params;
  const league = 'wnba';
  const teamData = await fetchWNBATeamSchedule(teamId);
  const [rosterData, teamsIds] = await Promise.all([fetchWNBARosterData(teamId), fetchWNBATeamIds()]);

  return (
    <main className="grid pb-6 min-[850px]:grid-cols-2 min-[1400px]:grid-cols-[3fr_2fr_4fr] mx-auto min-[850px]:max-[1349px]:[&>*:last-child]:col-span-2">
      <section className="w-full mx-auto p-2 md:p-3 xl:p-2 2xl:p-6 border-r border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Image
            src={teamData?.team?.logo || teamData?.team?.logos?.[0]?.href || 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png'}
            alt={`${teamData.team.displayName} logo`}
            unoptimized
            priority
            width={600}
            height={600}
            className={cn('size-14', {
              'dark:invert': teamData.team.color === '000000',
            })}
          />
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-2xl">{teamData.team.displayName}</h1>
              <FavoriteTeamButton teamId={teamId} teamName={teamData.team.displayName} league={league} />
            </div>
            <div className="w-full flex items-center justify-between gap-2 py-1">
              <h3 className="text-neutral-800 dark:text-neutral-300">{`${teamData.team.recordSummary} • ${teamData.team.standingSummary}`}</h3>
              <TeamSelector allTeams={teamsIds} teamId={teamId} league={league} />
            </div>
          </div>
        </div>

        <div>
          <Suspense fallback={<div>Loading schedule...</div>}>
            <WNBATeamSchedule teamId={teamId} />
          </Suspense>
        </div>
      </section>
      <section className="w-full mx-auto p-2 md:p-3 xl:p-2 2xl:p-6 2xl:pt-1 border-r border-neutral-200 dark:border-neutral-800">
        <Suspense fallback={<div>Loading standings...</div>}>
          <WNBAStandings currentTeam={teamId} variant="full" />
        </Suspense>
      </section>
      <section className="w-full mx-auto p-2 md:p-3 xl:p-2 2xl:p-6 2xl:pt-1 border-r border-neutral-200 dark:border-neutral-800">
        <Suspense fallback={<div>Loading player stats...</div>}>
          <WNBATeamPlayerStats teamStats={rosterData} />
        </Suspense>
      </section>
    </main>
  );
}

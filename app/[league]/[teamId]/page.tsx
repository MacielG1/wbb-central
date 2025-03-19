import TeamPlayerStats from '@/components/TeamPlayerStats';
import TeamSchedule from '@/components/TeamSchedule';
import TeamSelector from '@/components/TeamSelector';
import ConferenceStandings from '@/components/ConferenceStandings';
import FavoriteTeamButton from '@/components/FavoriteTeamButton';
import { cn } from '@/lib/utils';
import { fetchAllTeamIds } from '@/utils/fetchAllTeamIds';
import fetchRosterData from '@/utils/fetchRosterData';
import fetchTeamSchedule from '@/utils/fetchTeamSchedule';
import { fetchConferenceData } from '@/utils/fetchConferenceData';
import Image from 'next/image';
import { Suspense } from 'react';
import { Metadata } from 'next';

export type paramsType = Promise<{ teamId: string; league: string }>;

export async function generateMetadata({ params }: { params: paramsType }): Promise<Metadata> {
  const { league } = await params;
  const leagueName = league.toUpperCase();

  return {
    title: `Team Details - ${leagueName} Basketball`,
    description: `View team schedule, roster, stats and standings for ${leagueName} basketball.`,
    openGraph: {
      title: `Team Details - ${leagueName} Basketball`,
      description: `View team schedule, roster, stats and standings for ${leagueName} basketball.`,
    },
  };
}

export default async function TeamPage(props: { params: paramsType }) {
  const { teamId, league } = await props.params;

  const teamData = await fetchTeamSchedule(teamId);
  const conferenceId = teamData.team?.groups?.id;
  const [conferenceData, rosterData, teamsIds] = await Promise.all([fetchConferenceData(conferenceId), fetchRosterData(teamId), fetchAllTeamIds()]);

  return (
    <main className="grid pb-6 min-[850px]:grid-cols-2 min-[1400px]:grid-cols-[3fr_2fr_4fr] mx-auto min-[850px]:max-[1349px]:[&>*:last-child]:col-span-2">
      <section className="w-full mx-auto  p-2 md:p-3 xl:p-2 2xl:p-6 border-r border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Image
            src={teamData?.team?.logos?.[0]?.href}
            alt={''}
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
              <FavoriteTeamButton teamId={teamId} teamName={teamData.team.displayName} />
            </div>
            <div className="w-full flex items-center justify-between gap-2 py-1">
              <h3 className="text-neutral-800 dark:text-neutral-300">{`${teamData.team.recordSummary} • ${teamData.team.standingSummary}`}</h3>
              <TeamSelector allTeams={teamsIds} teamId={teamId} league={league} />
            </div>
          </div>
        </div>

        <div>
          <Suspense fallback={null}>
            <TeamSchedule data={teamData} league={league} />
          </Suspense>
        </div>
      </section>

      <section className="w-full mx-auto p-2 md:p-3 xl:p-2 2xl:p-6 2xl:pt-1 border-r border-neutral-200 dark:border-neutral-800">
        <Suspense fallback={null}>
          <ConferenceStandings currentTeam={teamId} conference={conferenceData?.name || ''} standings={conferenceData?.standings?.entries || []} league={league} />
        </Suspense>
      </section>

      <section className="w-full mx-auto p-2  md:p-3 xl:p-2 2xl:p-6 2xl:pt-1 border-r border-neutral-200 dark:border-neutral-800">
        <Suspense fallback={null}>
          <TeamPlayerStats players={rosterData.results[0].leaders} />
        </Suspense>
      </section>
    </main>
  );
}

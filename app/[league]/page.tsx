import NavbarScores from '@/components/NavbarScores';
import DateSelector from '@/components/DateSelector';
import fetchLeagueSchedule from '@/utils/fetchLeagueSchedule';
import type { APIResponse } from '@/types/espn';
import NationalRankings from '@/components/Rankings/NCAAWNationalRankings';
import { Suspense } from 'react';
import RankingsDisplaySkeleton from '@/components/Rankings/RankingsDisplaySkeleton';
import { Metadata } from 'next';
import TeamSelector from '@/components/TeamSelector';
import { fetchAllTeamIds } from '@/utils/fetchAllTeamIds';
import Schedule from '@/components/Schedule';

export type SearchParamsType = Promise<{ date?: string }>;
export type ParamsType = Promise<{ league: string }>;

export async function generateMetadata({ params }: { params: ParamsType }): Promise<Metadata> {
  const { league } = await params;
  const leagueName = league.toUpperCase();

  return {
    title: `${leagueName} Basketball`,
    description: `Live basketball scores, schedules, rankings and stats for ${leagueName} games.`,
    openGraph: {
      title: `${leagueName} Basketball`,
      description: `Live basketball scores, schedules, rankings and stats for ${leagueName} games.`,
    },
  };
}

export default async function LeaguePage(props: { searchParams: SearchParamsType; params: ParamsType }) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const currentDate = (await props.searchParams).date || 
    `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
  
  const { league } = await props.params;
  const data = (await fetchLeagueSchedule(currentDate)) as APIResponse;
  const teamsIds = await fetchAllTeamIds();

  return (
    <main>
      <Suspense fallback={null}>
        <NavbarScores data={data} />
      </Suspense>
      <div className="flex flex-col lg:flex-row max-w-full mx-auto px-0 lg:pl-4">
        <div className="flex-1 min-w-0 pt-2 pb-8 w-full lg:max-w-[1000px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-center 2xl:justify-between gap-16 sm:gap-2 lg:gap-4 xl:gap-8 3xl:gap-9 ">
            <div className="max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-[33.5rem] xl:max-w-[39.5rem] 2xl:max-w-[44.5rem] 3xl:max-w-[62rem]">
              <Suspense fallback={null}>
                <DateSelector league={data.leagues[0]} />
              </Suspense>
            </div>
            <div>
              <Suspense fallback={null}>
                <TeamSelector allTeams={teamsIds} league={league} maxWidth="max-w-[240px] z-[9999]" />
              </Suspense>
            </div>
          </div>

          <Schedule events={data.events} league={data.leagues[0].abbreviation.toLowerCase()} />
        </div>

        <div className="w-full lg:w-72 xl:w-80 shrink-0 justify-self-end">
          <Suspense fallback={<RankingsDisplaySkeleton />}>
            <NationalRankings />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

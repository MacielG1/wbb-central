import NavbarScores from '@/components/NavbarScores';
import DateSelector from '@/components/DateSelector';
import fetchLeagueSchedule from '@/utils/fetchLeagueSchedule';
import type { APIResponse } from '@/types/espn';
import NationalRankings from '@/components/Rankings/NCAAWNationalRankings';
import { Suspense } from 'react';
import RankingsDisplaySkeleton from '@/components/Rankings/RankingsDisplaySkeleton';
import Link from 'next/link';
import { TableProperties } from 'lucide-react';
import { Metadata } from 'next';
import TeamSelector from '@/components/TeamSelector';
import { fetchAllTeamIds } from '@/utils/fetchAllTeamIds';
import { Table } from '@/components/icons/Table';
import { redirect } from 'next/navigation';
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
  const dateFromUrl = (await props.searchParams).date;
  const { league } = await props.params;
  
  // Format today's date as YYYY-MM-DD
  const todayStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
  
  // If no date specified in URL, find the closest date with games
  if (!dateFromUrl) {

    const initialData = (await fetchLeagueSchedule(todayStr)) as APIResponse;
    
    if (initialData.leagues[0]?.calendar && initialData.leagues[0].calendar.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find closest date in available dates
      const availableDates = initialData.leagues[0].calendar.map(dateString => {
        const date = new Date(dateString);
        date.setHours(0, 0, 0, 0);
        return {
          date,
          dateString
        };
      });
      
      // First check for exact match with today
      const todayMatch = availableDates.find(d => 
        d.date.toDateString() === today.toDateString());
      
      if (todayMatch) {

        const formattedDate = todayMatch.dateString.split('T')[0];
        // Only redirect if it's not already today's date
        if (formattedDate !== todayStr) {
          redirect(`/${league}?date=${formattedDate}`);
        }
      } else {
        // Find closest date if no match for today
        const closestDate = availableDates.reduce((closest, current) => {
          const currentDiff = Math.abs(current.date.getTime() - today.getTime());
          const closestDiff = Math.abs(closest.date.getTime() - today.getTime());
          return currentDiff < closestDiff ? current : closest;
        }, availableDates[0]);
        
        // Redirect to the closest date
        const closestDateFormatted = closestDate.dateString.split('T')[0];
        redirect(`/${league}?date=${closestDateFormatted}`);
      }
    }
  }
  
  const dateToFetch = dateFromUrl || todayStr;
  const data = (await fetchLeagueSchedule(dateToFetch)) as APIResponse;
  const teamsIds = await fetchAllTeamIds();

  return (
    <main>
      <Suspense fallback={null}>
        <NavbarScores data={data} />
      </Suspense>
      <div className="absolute pt-12 pl-4 lg:pl-8 max-2xl:pt-16 flex gap-1 md:pt-14 lg:gap-0 2xl:gap-1 flex-col z-[999]">
        <Link href={`/${league}/players`} className="flex items-center gap-1 font-light text-sm text-neutral-300 hover:text-neutral-400 transition-all">
          <TableProperties className="size-4" />
          Players Stats
        </Link>
        <Link href={`/${league}/teams`} className="flex items-center gap-1 font-light text-sm text-neutral-300 hover:text-neutral-400 transition-all">
          <Table className="size-4" />
          Teams Stats
        </Link>
      </div>
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

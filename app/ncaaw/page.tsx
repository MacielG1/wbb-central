import NavbarScores from '@/components/NavbarScores';
import DateSelector from '@/components/DateSelector';
import fetchSchedule from '@/utils/NCAAW/fetchSchedule';
import type { APIResponse } from '@/types/espn';
import NationalRankings from '@/components/Rankings/NCAAWNationalRankings';
import { Suspense } from 'react';
import NCAAWSchedule from '@/components/NCAAWSchedule';
import RankingsDisplaySkeleton from '@/components/Rankings/RankingsDisplaySkeleton';
import Link from 'next/link';
import { TableProperties } from 'lucide-react';
import { Metadata } from 'next';
import TeamSelector from '@/components/TeamSelector';
import { fetchAllTeamIds } from '@/utils/NCAAW/fetchAllTeamIds';
import { Table } from '@/components/icons/Table';

export type SearchParamsType = Promise<{ date?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'NCAAW Basketball',
    description: 'Live NCAA Women\'s basketball scores, schedules, rankings and stats for NCAAW games.',
    openGraph: {
      title: 'NCAAW Basketball',
      description: 'Live NCAA Women\'s basketball scores, schedules, rankings and stats for NCAAW games.',
    },
  };
}

export default async function NCAAWPage(props: { searchParams: SearchParamsType }) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const currentDate = (await props.searchParams).date || 
    `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;

  let data = (await fetchSchedule(currentDate)) as APIResponse;
  
  if (data.events.length === 0 && !(await props.searchParams).date) {

    const availableDates = data.leagues[0].calendar;
    
    if (availableDates && availableDates.length > 0) {
      const today = new Date();
      let closestDate = availableDates[0];
      let closestDiff = Math.abs(new Date(closestDate).getTime() - today.getTime());
      
      for (const dateStr of availableDates) {
        const date = new Date(dateStr);
        const diff = Math.abs(date.getTime() - today.getTime());
        
        if (diff < closestDiff) {
          closestDate = dateStr;
          closestDiff = diff;
        }
      }
      
      const closestDateObj = new Date(closestDate);
      const year = closestDateObj.getFullYear();
      const month = String(closestDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(closestDateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      data = (await fetchSchedule(formattedDate)) as APIResponse;
    }
  }
  
  const teamsIds = await fetchAllTeamIds();
  return (
    <main>
      <Suspense fallback={null}>
        <NavbarScores data={data} />
      </Suspense>
      <div className="absolute pt-12 pl-4 lg:pl-8 max-2xl:pt-16 flex gap-1 md:pt-14 lg:gap-0 2xl:gap-1 flex-col z-[999]">
        <Link href="/ncaaw/players" className="flex items-center gap-1 font-light text-sm text-neutral-300 hover:text-neutral-400 transition-all">
          <TableProperties className="size-4" />
          Players Stats
        </Link>
        <Link href="/ncaaw/teams" className="flex items-center gap-1 font-light text-sm text-neutral-300 hover:text-neutral-400 transition-all">
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
                <TeamSelector allTeams={teamsIds} league="ncaaw" maxWidth="max-w-[240px] z-[9999]" />
              </Suspense>
            </div>
          </div>

          <NCAAWSchedule events={data.events} league={data.leagues[0].abbreviation.toLowerCase()} />
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
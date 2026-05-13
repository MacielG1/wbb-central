import NavbarScores from '@/components/NavbarScores';
import DateSelector from '@/components/DateSelector';
import { Suspense } from 'react';
import WNBASchedule from '@/components/WNBASchedule';
import Link from 'next/link';
import { TableProperties } from 'lucide-react';
import { Metadata } from 'next';
import TeamSelector from '@/components/TeamSelector';
import { fetchWNBATeamIds } from '@/utils/WNBA/fetchTeamIds';
import { Table } from '@/components/icons/Table';
import WNBAStandings from '@/components/WNBAStandings';
import { fetchWNBASchedule } from '@/utils/WNBA/fetchSchedule';

export type SearchParamsType = Promise<{ date?: string }>;

function parseDateString(dateString: string) {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(dateString);
  if (!Number.isNaN(parsedDate.getTime())) {
    return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  }

  return new Date(Number.NaN);
}

function formatDateString(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'WNBA Basketball',
    description: 'Live WNBA basketball scores, schedules, standings and stats for WNBA games.',
    openGraph: {
      title: 'WNBA Basketball',
      description: 'Live WNBA basketball scores, schedules, standings and stats for WNBA games.',
    },
  };
}

export default async function WNBAPage(props: { searchParams: SearchParamsType }) {
  const searchParams = await props.searchParams;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const currentDate = searchParams.date || 
    `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;

  const teamsIdsPromise = fetchWNBATeamIds();
  let data = await fetchWNBASchedule(currentDate);
  const events = data.events ?? [];
  const league = data.leagues?.[0] ?? { calendar: [], abbreviation: 'wnba' };

  if (events.length === 0 && !searchParams.date) {

    const availableDates = league.calendar;
    
    if (availableDates && availableDates.length > 0) {
      const todayParts = formatter.formatToParts(new Date());
      const todayYear = parseInt(todayParts.find((p) => p.type === 'year')?.value || '0');
      const todayMonth = parseInt(todayParts.find((p) => p.type === 'month')?.value || '0') - 1;
      const todayDay = parseInt(todayParts.find((p) => p.type === 'day')?.value || '0');
      const today = new Date(todayYear, todayMonth, todayDay);
      const validAvailableDates = availableDates.filter((dateStr) => !Number.isNaN(parseDateString(dateStr).getTime()));

      if (validAvailableDates.length > 0) {
        let closestDate = validAvailableDates[0];
        let closestDiff = Math.abs(parseDateString(closestDate).getTime() - today.getTime());

        for (const dateStr of validAvailableDates) {
          const date = parseDateString(dateStr);
          const diff = Math.abs(date.getTime() - today.getTime());

          if (diff < closestDiff) {
            closestDate = dateStr;
            closestDiff = diff;
          }
        }

        const formattedDate = formatDateString(parseDateString(closestDate));

        if (formattedDate) {
          data = await fetchWNBASchedule(formattedDate);
        }
      }
    }
  }

  const teamsIds = await teamsIdsPromise;
  const displayEvents = data.events ?? [];
  const displayLeague = data.leagues?.[0] ?? league;

  return (
    <main>
      <Suspense fallback={null}>
        <NavbarScores data={data} />
      </Suspense>
      <div className="absolute pt-12 pl-4 lg:pl-8 max-2xl:pt-16 flex gap-1 md:pt-14 lg:gap-0 2xl:gap-1 flex-col z-[999]">
        <Link href="/wnba/players" className="flex items-center gap-1 font-light text-sm text-neutral-300 hover:text-neutral-400 transition-all">
          <TableProperties className="size-4" />
          Players Stats
        </Link>
        <Link href="/wnba/teams" className="flex items-center gap-1 font-light text-sm text-neutral-300 hover:text-neutral-400 transition-all">
          <Table className="size-4" />
          Teams Stats
        </Link>
      </div> 
      <div className="flex flex-col lg:flex-row max-w-full mx-auto px-0 lg:pl-2">
        <div className="flex-1 min-w-0 pt-2 pb-8 w-full lg:max-w-[1000px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-center 2xl:justify-between gap-16 sm:gap-2 lg:gap-4 xl:gap-8 3xl:gap-9 ">
            <div className="max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-[33.5rem] xl:max-w-[39.5rem] 2xl:max-w-[44.5rem] 3xl:max-w-[62rem]">
              <Suspense fallback={null}>
                <DateSelector league={displayLeague} />
              </Suspense>
            </div>
            <div>
              <Suspense fallback={null}>
                <TeamSelector allTeams={teamsIds} league="wnba" maxWidth="max-w-[240px] z-[9999]" />
              </Suspense>
            </div>
          </div>

          <WNBASchedule events={displayEvents} league={displayLeague.abbreviation.toLowerCase()} />
        </div>

        <div className="w-full lg:w-72 xl:w-[330px] shrink-0 justify-self-end">
          <Suspense fallback={null}>
            <WNBAStandings />
          </Suspense>
        </div>
      </div>
    </main>
  );
} 
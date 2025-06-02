import TeamScheduleRow from './TeamScheduleRow';
import fetchWNBATeamSchedule from '../utils/WNBA/fetchTeamSchedule';
import { WNBAEvent } from '../types/wnba';

interface WNBATeamScheduleProps {
  teamId: string;
}

export default async function WNBATeamSchedule({ teamId }: WNBATeamScheduleProps) {
  const data = await fetchWNBATeamSchedule(teamId);
  
  return (
    <div className="mt-4 space-y-1 divide-y divide-neutral-200 dark:divide-neutral-800">
      <h2 className="font-medium text-lg pb-2">Team Schedule</h2>
      {data.events.length > 0 ? (
        data.events.map((game: WNBAEvent, index: number) => (
          <TeamScheduleRow 
            key={game.id} 
            game={game} 
            isLast={index === data.events.length - 1} 
            teamId={data.team.id} 
            league="wnba" 
          />
        ))
      ) : (
        <p className="py-3 text-neutral-500 dark:text-neutral-400">No games scheduled at this time.</p>
      )}
    </div>
  );
} 
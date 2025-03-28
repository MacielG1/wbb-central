'use client';

import { useEffect, useState } from 'react';
import ScheduleRow from './ScheduleRow';
import { Competitor } from '@/types/espn';
import { get, set } from 'idb-keyval';
import LoadingSpinner from './LoadingSpinner';
import { Switch } from '@/components/ui/switch';
import getFavorites from '@/lib/getFavorites';
import { useRouter } from 'next/navigation';

interface FilterToggleProps {
  onToggle: () => void;
  showOnlyTop25: boolean;
  onMarchMadnessToggle: () => void;
  showOnlyMarchMadness: boolean;
  hasMarchMadnessGames: boolean;
}

function FilterToggle({ 
  onToggle, 
  showOnlyTop25, 
  onMarchMadnessToggle, 
  showOnlyMarchMadness,
  hasMarchMadnessGames 
}: FilterToggleProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 px-4 my-1.5 relative">
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {hasMarchMadnessGames ? (
          <div className="flex items-center space-x-2">
            <div 
              className="flex items-center space-x-2 group relative"
              data-tooltip="Show only NCAA March Madness tournament games"
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-800 text-neutral-200 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-200 delay-700 pointer-events-none whitespace-nowrap z-[9999]">
                Show only NCAA March Madness tournament games
              </div>
              <Switch 
                id="marchmadness" 
                checked={showOnlyMarchMadness} 
                onCheckedChange={onMarchMadnessToggle} 
                className="cursor-pointer data-[state=checked]:bg-indigo-600 [&>span]:data-[state=checked]:bg-neutral-300 z-[999]"
              />
              <label 
                htmlFor="marchmadness" 
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                March Madness
              </label>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div 
              className="flex items-center space-x-2 group relative"
              data-tooltip="Show only Top 25 ranked teams and your favorite teams"
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-800 text-neutral-200 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-200 delay-700 pointer-events-none whitespace-nowrap z-[9999]">
                Show only Top 25 ranked teams and your favorite teams
              </div>
              <Switch 
                id="top25" 
                checked={showOnlyTop25} 
                onCheckedChange={onToggle} 
                className="cursor-pointer data-[state=checked]:bg-indigo-600 [&>span]:data-[state=checked]:bg-neutral-300 z-[999]" 
              />
              <label 
                htmlFor="top25" 
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >
                Top 25
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ScheduleProps {
  events: any[];
  league: string;
  tRankMap?: Record<string, number>;
}

export default function Schedule({ events: initialEvents, league, tRankMap = {} }: ScheduleProps) {
  const [showOnlyTop25, setShowOnlyTop25] = useState(false);
  const [showOnlyMarchMadness, setShowOnlyMarchMadness] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState(initialEvents);
  const router = useRouter();

  // Check if any March Madness games are available
  const hasMarchMadnessGames = events.some(game => 
    game.competitions[0].notes?.some((note: any) => 
      note.type === "event" && (note.headline?.includes("NCAA") && note.headline?.includes("Championship")) || 
      note.headline?.includes("March Madness")
    )
  );

  // Load the values from IndexedDB on mount
  useEffect(() => {
    const loadStoredValues = async () => {
      if (typeof window !== 'undefined') {
        const storedTop25 = await get('showOnlyTop25');
        const storedMarchMadness = await get('showOnlyMarchMadness');
        
        setShowOnlyTop25(storedTop25 === true);
        setShowOnlyMarchMadness(storedMarchMadness === true);
        
        setIsLoading(false);
      }
    };
    loadStoredValues();
  }, []);

  // Update events when initialEvents changes
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);


  function handleToggle() {
    const newValue = !showOnlyTop25;
    setShowOnlyTop25(newValue);
    set('showOnlyTop25', newValue);
  }

  function handleMarchMadnessToggle() {
    const newValue = !showOnlyMarchMadness;
    setShowOnlyMarchMadness(newValue);
    set('showOnlyMarchMadness', newValue);
  }

  const hasNoGamesToShow =
    events.length > 0 &&
    !events.some((game) => {
      const competitors = game.competitions[0].competitors;
      const hasTop25Team = competitors.some((team: Competitor) => (team.curatedRank && team.curatedRank.current ? team.curatedRank.current <= 25 : false));
      const hasFavoriteTeam = competitors.some((team: Competitor) => {
        const favorites = getFavorites();
        return favorites[team.team.id];
      });
      const isMarchMadnessGame = game.competitions[0].notes?.some((note: any) => 
        note.type === "event" && (note.headline?.includes("NCAA") && note.headline?.includes("Championship")) || 
        note.headline?.includes("March Madness")
      );

      if (showOnlyMarchMadness && hasMarchMadnessGames) {
        return isMarchMadnessGame;
      }
      if (showOnlyTop25) {
        return hasTop25Team || hasFavoriteTeam;
      }
      return true;
    });

  // Sort games by status: in progress -> upcoming -> completed
  const sortedEvents = [...events].filter(game => {
    if (!showOnlyMarchMadness && !showOnlyTop25) return true;
    
    const competitors = game.competitions[0].competitors;
    const hasTop25Team = competitors.some((team: Competitor) => (team.curatedRank && team.curatedRank.current ? team.curatedRank.current <= 25 : false));
    const hasFavoriteTeam = competitors.some((team: Competitor) => {
      const favorites = getFavorites();
      return favorites[team.team.id];
    });
    const isMarchMadnessGame = game.competitions[0].notes?.some((note: any) => 
      note.type === "event" && note.headline?.includes("NCAA") && note.headline?.includes("Championship")
    );

    if (showOnlyMarchMadness && hasMarchMadnessGames) return isMarchMadnessGame;
    if (showOnlyTop25) return hasTop25Team || hasFavoriteTeam;
    return true;
  }).sort((a, b) => {
    const aStatus = a.status.type;
    const bStatus = b.status.type;

    // In progress games first
    if (aStatus.state === 'in' && bStatus.state !== 'in') return -1;
    if (bStatus.state === 'in' && aStatus.state !== 'in') return 1;

    // Then upcoming games
    if (!aStatus.completed && bStatus.completed) return -1;
    if (!bStatus.completed && aStatus.completed) return 1;

    // Finally sort by game time for upcoming games
    if (!aStatus.completed && !bStatus.completed) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }

    // For completed games, sort by most recent
    if (aStatus.completed && bStatus.completed) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }

    return 0;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[30%]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <FilterToggle 
        showOnlyTop25={showOnlyTop25} 
        onToggle={handleToggle} 
        onMarchMadnessToggle={handleMarchMadnessToggle}
        showOnlyMarchMadness={showOnlyMarchMadness}
        hasMarchMadnessGames={hasMarchMadnessGames}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 md:mt-5 2xl:mt-0">
        {(showOnlyTop25 || (showOnlyMarchMadness && hasMarchMadnessGames)) && hasNoGamesToShow ? (
          <div className="col-span-full p-4 text-center text-neutral-600 dark:text-neutral-400">
            {showOnlyMarchMadness && hasMarchMadnessGames ? "No March Madness games scheduled" : "No Top 25 or favorite team games scheduled"}
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full p-4 text-center text-neutral-600 dark:text-neutral-400">No games scheduled for today</div>
        ) : (
          sortedEvents.map((game, index) => (
            <ScheduleRow 
              key={game.id} 
              game={game} 
              league={league} 
              showOnlyTop25={showOnlyTop25} 
              tRankMap={tRankMap} 
            />
          ))
        )}
      </div>
    </>
  );
}

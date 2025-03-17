'use client';

import { useEffect, useState, useTransition } from 'react';
import ScheduleRow from './ScheduleRow';
import { Competitor } from '@/types/espn';
import { get, set } from 'idb-keyval';
import LoadingSpinner from './LoadingSpinner';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterToggleProps {
  onToggle: () => void;
  showOnlyTop25: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  showRefreshButton?: boolean;
}

function FilterToggle({ onToggle, showOnlyTop25, onRefresh, isRefreshing, showRefreshButton = true }: FilterToggleProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 px-4 my-1.5 relative">
      <div className="flex-1" />
      {showRefreshButton && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 disabled:opacity-50 transition-colors cursor-pointer absolute left-1/2 -translate-x-1/2"
        >
          <RotateCw className={cn("size-4", { "animate-spin": isRefreshing })} />
        </button>
      )}
      <div className="flex items-center space-x-2">
        <Switch id="top25" checked={showOnlyTop25} onCheckedChange={onToggle} className="data-[state=checked]:bg-indigo-600 [&>span]:data-[state=checked]:bg-neutral-300 z-[999]" />
        <label htmlFor="top25" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Top 25
        </label>
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
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState(initialEvents);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Load the value from IndexedDB on mount
  useEffect(() => {
    const loadStoredValue = async () => {
      if (typeof window !== 'undefined') {
        const stored = await get('showOnlyTop25');
        if (stored === true) {
          setShowOnlyTop25(true);
        }
        setIsLoading(false);
      }
    };
    loadStoredValue();
  }, []);

  // Update events when initialEvents changes
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  // No need for useCallback with React Compiler
  function handleToggle() {
    const newValue = !showOnlyTop25;
    setShowOnlyTop25(newValue);
    set('showOnlyTop25', newValue);
  }

  const hasNoGamesToShow =
    events.length > 0 &&
    !events.some((game) => {
      const competitors = game.competitions[0].competitors;
      const hasTop25Team = competitors.some((team: Competitor) => (team.curatedRank && team.curatedRank.current ? team.curatedRank.current <= 25 : false));

      return hasTop25Team 
    });

  // Sort games by status: in progress -> upcoming -> completed
  const sortedEvents = [...events].sort((a, b) => {
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
        onRefresh={handleRefresh}
        isRefreshing={isPending}
        showRefreshButton={events.length > 0 && !(showOnlyTop25 && hasNoGamesToShow)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2">
        {showOnlyTop25 && hasNoGamesToShow ? (
          <div className="col-span-full p-4 text-center text-neutral-600 dark:text-neutral-400">No Top 25 or favorite team games scheduled</div>
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

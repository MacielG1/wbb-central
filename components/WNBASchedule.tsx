"use client";
// import { Suspense } from 'react';
import ScheduleRow from './ScheduleRow';
import { get, set } from 'idb-keyval';
import LoadingSpinner from './LoadingSpinner';
import { Switch } from '@/components/ui/switch';
import getFavorites from '@/lib/getFavorites';
import { useRouter } from 'next/navigation';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useTransition } from 'react';

interface WNBAScheduleProps {
  events: any[];
  league: string;
}

function FilterToggle({ 
  onToggle, 
  showOnlyFavorites, 
  onRefresh, 
  isRefreshing, 
  showRefreshButton = true,
}: { 
  onToggle: () => void;
  showOnlyFavorites: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  showRefreshButton?: boolean;
}) {
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
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <div 
            className="flex items-center space-x-2 group relative"
            data-tooltip="Show only your favorite teams"
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-800 text-neutral-200 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-200 delay-700 pointer-events-none whitespace-nowrap z-[9999]">
              Show only your favorite teams
            </div>
            <Switch 
              id="favorites" 
              checked={showOnlyFavorites} 
              onCheckedChange={onToggle} 
              className="cursor-pointer data-[state=checked]:bg-indigo-600 [&>span]:data-[state=checked]:bg-neutral-300 z-[999]" 
            />
            <label 
              htmlFor="favorites" 
              className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Favorites
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WNBASchedule({ events: initialEvents, league }: WNBAScheduleProps) {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState(initialEvents);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const loadStoredValues = async () => {
      if (typeof window !== 'undefined') {
        const storedFavorites = await get('showOnlyFavorites');
        setShowOnlyFavorites(storedFavorites === true);
        setIsLoading(false);
      }
    };
    loadStoredValues();
  }, []);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleToggle() {
    const newValue = !showOnlyFavorites;
    setShowOnlyFavorites(newValue);
    set('showOnlyFavorites', newValue);
  }

  const hasNoGamesToShow =
    events.length > 0 &&
    !events.some((game) => {
      const competitors = game.competitions[0].competitors;
      const hasFavoriteTeam = competitors.some((team: any) => {
        const favorites = getFavorites('wnba');
        return favorites[team.team.id];
      });

      if (showOnlyFavorites) {
        return hasFavoriteTeam;
      }
      return true;
    });

  const sortedEvents = [...events].filter(game => {
    if (!showOnlyFavorites) return true;
    
    const competitors = game.competitions[0].competitors;
    const hasFavoriteTeam = competitors.some((team: any) => {
      const favorites = getFavorites('wnba');
      return favorites[team.team.id];
    });

    if (showOnlyFavorites) return hasFavoriteTeam;
    return true;
  }).sort((a, b) => {
    const aStatus = a.status.type;
    const bStatus = b.status.type;

    if (aStatus.state === 'in' && bStatus.state !== 'in') return -1;
    if (bStatus.state === 'in' && aStatus.state !== 'in') return 1;

    if (!aStatus.completed && bStatus.completed) return -1;
    if (!bStatus.completed && aStatus.completed) return 1;

    if (!aStatus.completed && !bStatus.completed) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }

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
        showOnlyFavorites={showOnlyFavorites} 
        onToggle={handleToggle} 
        onRefresh={handleRefresh}
        isRefreshing={isPending}
        showRefreshButton={events.length > 0 && !(showOnlyFavorites && hasNoGamesToShow)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 md:mt-5 2xl:mt-0">
        {showOnlyFavorites && hasNoGamesToShow ? (
          <div className="col-span-full p-4 text-center text-neutral-600 dark:text-neutral-400">
            No favorite team games scheduled
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full p-4 text-center text-neutral-600 dark:text-neutral-400">
            No games scheduled for today
          </div>
        ) : (
          sortedEvents.map((game) => (
            <ScheduleRow key={game.id} game={game} league={league} />
          ))
        )}
      </div>
    </>
  );
} 
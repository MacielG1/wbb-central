'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useEffect, useState, useTransition } from 'react';
import type { League } from '@/types/espn';
import Link from 'next/link';

interface DateSelectorProps {
  league: League;
}

export default function DateSelector({ league }: DateSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentDateRef = useRef<HTMLAnchorElement>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  const hasInitialScrolledRef = useRef(false);
  const userClickedDateRef = useRef(false);

  function getTodayInET() {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parseInt(parts.find((p) => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find((p) => p.type === 'month')?.value || '0') - 1;
    const day = parseInt(parts.find((p) => p.type === 'day')?.value || '0');
    return new Date(year, month, day);
  }

  const currentDate = searchParams.get('date') ? parseUrlDate(searchParams.get('date')!) : getTodayInET();

  function parseUrlDate(dateString: string) {
    const cleanDate = dateString.replace(/-/g, '');
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1;
    const day = parseInt(cleanDate.substring(6, 8));
    return new Date(year, month, day);
  }

  const availableDates = league.calendar.map((dateString) => {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  function findClosestAvailableDate(targetDate: Date, availableDates: Date[]) {
    const exactMatch = availableDates.find((date) => date.toDateString() === targetDate.toDateString());

    if (exactMatch) return exactMatch;

    // If no exact match, find closest date
    return availableDates.reduce((closest, date) => {
      const currentDiff = Math.abs(date.getTime() - targetDate.getTime());
      const closestDiff = Math.abs(closest.getTime() - targetDate.getTime());
      return currentDiff < closestDiff ? date : closest;
    }, availableDates[0]);
  }

  // Get the closest available date to the current date
  const closestAvailableDate = availableDates.length > 0 ? findClosestAvailableDate(currentDate, availableDates) : null;

  function formatDateForUrl(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(date: Date) {
    const today = getTodayInET();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  const createQueryString = useCallback(
    (date: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('date', date);
      return params.toString();
    },
    [searchParams]
  );

  function scrollDates(direction: 'left' | 'right') {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of the visible width
    const targetScroll = container.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  }

  const scrollToCurrentDate = useCallback(() => {
    if (scrollContainerRef.current && currentDateRef.current) {
      currentDateRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentDate, closestAvailableDate]);

  // Set up ResizeObserver to detect when container is ready
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const readyTimer = setTimeout(() => {
      setIsContentReady(true);
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      if (scrollContainerRef.current && scrollContainerRef.current.clientWidth > 0) {
        setIsContentReady(true);
      }
    });

    resizeObserver.observe(scrollContainerRef.current);

    return () => {
      clearTimeout(readyTimer);
      resizeObserver.disconnect();
    };
  }, []);

  // Check if current date is centered in viewport
  const isDateCentered = useCallback(() => {
    if (!scrollContainerRef.current || !currentDateRef.current) return false;

    const container = scrollContainerRef.current;
    const dateElement = currentDateRef.current;
    const containerRect = container.getBoundingClientRect();
    const dateRect = dateElement.getBoundingClientRect();

    const containerCenter = containerRect.left + containerRect.width / 2;
    const dateCenter = dateRect.left + dateRect.width / 2;

    return Math.abs(containerCenter - dateCenter) < 100;
  }, []);

  useEffect(() => {
    if (!isContentReady || hasInitialScrolledRef.current) return;

    scrollToCurrentDate();
    hasInitialScrolledRef.current = true;

    const retryDelays = [100, 300];
    const retryTimers = retryDelays.map((delay) =>
      setTimeout(() => {
        if (scrollContainerRef.current && currentDateRef.current && !userClickedDateRef.current) {
          scrollToCurrentDate();
        }
      }, delay)
    );

    const threeSecondTimer = setTimeout(() => {
      if (!currentDateRef.current && scrollContainerRef.current && !userClickedDateRef.current) {
        scrollToCurrentDate();
      }
    }, 3000);

    return () => {
      retryTimers.forEach((timer) => clearTimeout(timer));
      clearTimeout(threeSecondTimer);
    };
  }, [isContentReady, scrollToCurrentDate]);

  useEffect(() => {
    if (!isContentReady) return;

    const lateCheckTimer = setTimeout(() => {
      if (!userClickedDateRef.current && currentDateRef.current && !isDateCentered()) {
        scrollToCurrentDate();
      }
    }, 1000);

    return () => clearTimeout(lateCheckTimer);
  }, [isContentReady, isDateCentered, scrollToCurrentDate]);

  // Reset user click flag after navigation completes
  useEffect(() => {
    if (!isPending && userClickedDateRef.current) {
      const timer = setTimeout(() => {
        userClickedDateRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPending]);

  // Clear loading date when transition completes or date changes
  useEffect(() => {
    if (!isPending) {
      setLoadingDate(null);
    }
  }, [isPending, currentDate]);

  return (
    <div className={cn('relative flex items-center px-4 py-2 bg-white dark:bg-neutral-900 border-b-0 border-neutral-200 dark:border-neutral-800')}>
      <button
        onClick={() => scrollDates('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full shrink-0 z-10 bg-white dark:bg-neutral-900"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div ref={scrollContainerRef} className="flex space-x-1 overflow-x-auto scrollbar-hide scroll-smooth flex-1 min-w-0 pl-8 pr-8">
        {availableDates.map((date) => {
          const urlDate = formatDateForUrl(date);
          const isCurrentDate = date.toDateString() === currentDate.toDateString();
          const isClosestDate = !isCurrentDate && closestAvailableDate && date.toDateString() === closestAvailableDate.toDateString();
          const shouldHighlight = isCurrentDate || isClosestDate;

          const isLoading = loadingDate === urlDate;

          return (
            <Link
              key={date.toISOString()}
              ref={shouldHighlight ? currentDateRef : null}
              href={`?${createQueryString(urlDate)}`}
              prefetch={true}
              onClick={(e) => {
                userClickedDateRef.current = true;
                setLoadingDate(urlDate);
                // Auto-center the clicked date
                const target = e.currentTarget;
                setTimeout(() => {
                  target.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest',
                  });
                }, 50);
                startTransition(() => {
                  router.push(`?${createQueryString(urlDate)}`);
                });
              }}
              className={cn(
                'relative px-3 py-1 text-sm rounded-full whitespace-nowrap shrink-0 cursor-pointer transition-opacity',
                shouldHighlight ? 'bg-indigo-600 text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                isLoading && 'pointer-events-none'
              )}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-neutral-900/90 rounded-full z-10">
                  <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
              )}
              <span className={cn(isLoading && 'opacity-60')}>{formatDateForDisplay(date)}</span>
            </Link>
          );
        })}
      </div>

      <button
        onClick={() => scrollDates('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full shrink-0 z-30 bg-white dark:bg-neutral-900"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

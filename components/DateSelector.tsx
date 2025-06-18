'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useEffect, useState } from 'react';
import type { League } from '@/types/espn';

interface DateSelectorProps {
  league: League;
}

export default function DateSelector({ league }: DateSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentDateRef = useRef<HTMLAnchorElement>(null);
  const [isContentReady, setIsContentReady] = useState(false);

  const currentDate = searchParams.get('date') ? parseUrlDate(searchParams.get('date')!) : new Date();

  function parseUrlDate(dateString: string) {
    const cleanDate = dateString.replace(/-/g, '');
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1;
    const day = parseInt(cleanDate.substring(6, 8));
    return new Date(year, month, day);
  }

  // Get available dates from calendar
  const availableDates = league.calendar.map((dateString) => {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Find closest date in available dates
  function findClosestAvailableDate(targetDate: Date, availableDates: Date[]) {
    // First check if the exact date exists
    const exactMatch = availableDates.find(date => 
      date.toDateString() === targetDate.toDateString());
    
    if (exactMatch) return exactMatch;
    
    // If no exact match, find closest date
    return availableDates.reduce((closest, date) => {
      const currentDiff = Math.abs(date.getTime() - targetDate.getTime());
      const closestDiff = Math.abs(closest.getTime() - targetDate.getTime());
      return currentDiff < closestDiff ? date : closest;
    }, availableDates[0]);
  }

  // Get the closest available date to the current date
  const closestAvailableDate = availableDates.length > 0 
    ? findClosestAvailableDate(currentDate, availableDates) 
    : null;

  function formatDateForUrl(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(date: Date) {
    const today = new Date();
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
    if (!scrollContainerRef.current || !currentDateRef.current) return;

    const container = scrollContainerRef.current;
    const target = currentDateRef.current;
    
    // Calculate the center position
    const containerWidth = container.clientWidth;
    const targetLeft = target.offsetLeft;
    const targetWidth = target.clientWidth;
    
    // Calculate the scroll position that would center the target
    const scrollLeft = targetLeft - (containerWidth / 2) + (targetWidth / 2);
    
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
  }, [currentDate, closestAvailableDate]);

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

  useEffect(() => {
    if (!isContentReady) return;

    scrollToCurrentDate();

    // Multiple retry attempts with increasing delays
    const retryDelays = [100, 300, 500, 1000, 3000];
    const retryTimers = retryDelays.map(delay => 
      setTimeout(() => {
        if (scrollContainerRef.current && currentDateRef.current) {
          scrollToCurrentDate();
        }
      }, delay)
    );

    return () => {
      retryTimers.forEach(timer => clearTimeout(timer));
    };
  }, [isContentReady, scrollToCurrentDate]);

  // Add a mutation observer to handle dynamic content changes
  useEffect(() => {
    if (!isContentReady || !scrollContainerRef.current) return;

    const observer = new MutationObserver(() => {
      scrollToCurrentDate();
    });

    observer.observe(scrollContainerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [isContentReady, scrollToCurrentDate]);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-neutral-900 border-b-0 border-neutral-200 dark:border-neutral-800">
      <button onClick={() => scrollDates('left')} className="p-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full shrink-0 z-[10]">
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div ref={scrollContainerRef} className="flex space-x-1 overflow-x-auto scrollbar-hide mx-2 scroll-smooth">
        {availableDates.map((date) => {
          const urlDate = formatDateForUrl(date);
          const isCurrentDate = date.toDateString() === currentDate.toDateString();
          const isClosestDate = !isCurrentDate && closestAvailableDate && 
                               date.toDateString() === closestAvailableDate.toDateString();
          const shouldHighlight = isCurrentDate || isClosestDate;
          
          return (
            <a
              key={date.toISOString()}
              ref={shouldHighlight ? currentDateRef : null}
              href={`?${createQueryString(urlDate)}`}
              onClick={(e) => {
                e.preventDefault();
                router.push(`?${createQueryString(urlDate)}`);
              }}
              className={cn(
                'px-3 py-1 text-sm rounded-full whitespace-nowrap shrink-0 cursor-pointer',
                shouldHighlight ? 'bg-indigo-600 text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              {formatDateForDisplay(date)}
            </a>
          );
        })}
      </div>

      <button onClick={() => scrollDates('right')} className="p-1 cursor-pointer z-[10] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full shrink-0">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

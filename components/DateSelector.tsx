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

  // Get current date from URL or use today
  const currentDate = searchParams.get('date') ? parseUrlDate(searchParams.get('date')!) : new Date();

  // Parse date from YYYY-MM-DD format
  function parseUrlDate(dateString: string) {
    // Remove hyphens from the date string before parsing
    const cleanDate = dateString.replace(/-/g, '');
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1;
    const day = parseInt(cleanDate.substring(6, 8));
    return new Date(year, month, day);
  }

  // Get available dates from calendar
  const availableDates = league.calendar.map((dateString) => {
    const date = new Date(dateString);
    // Adjust for timezone if needed
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

  // Format date for URL (YYYY-MM-DD format)
  function formatDateForUrl(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format date for display
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

  // Create URL with new date
  const createQueryString = useCallback(
    (date: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('date', date);
      return params.toString();
    },
    [searchParams]
  );

  // Scroll dates left or right
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

  // Function to scroll to the current date
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
   
    // Mark content as ready after a short delay to ensure DOM is stable
    const readyTimer = setTimeout(() => {
      setIsContentReady(true);
    }, 100);

    // Set up ResizeObserver to detect when container dimensions change
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

  // Scroll to current date with multiple retries
  useEffect(() => {
    if (!isContentReady) return;

    // Initial scroll attempt
    scrollToCurrentDate();

    const retryDelays = [100, 500, 2000];
    const retryTimers = retryDelays.map(delay => 
      setTimeout(scrollToCurrentDate, delay)
    );

    // Clean up timers on unmount
    return () => {
      retryTimers.forEach(timer => clearTimeout(timer));
    };
  }, [isContentReady, scrollToCurrentDate]);

  // Also scroll when the current date changes
  useEffect(() => {
    if (isContentReady) {
      scrollToCurrentDate();
    }
  }, [currentDate, isContentReady, scrollToCurrentDate]);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-neutral-900 border-b-0 border-neutral-200 dark:border-neutral-800">
      <button onClick={() => scrollDates('left')} className="p-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full shrink-0 z-[10]">
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div ref={scrollContainerRef} className="flex space-x-1 overflow-x-auto scrollbar-hide mx-2 scroll-smooth">
        {availableDates.map((date) => {
          const urlDate = formatDateForUrl(date);
          // Check if this is the current date OR the closest date if current date is not available
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

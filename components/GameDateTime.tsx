'use client';

import { useState, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';

interface GameDateTimeProps {
  gameDate: string;
  status?: {
    type: {
      completed: boolean;
      description: string;
      detail: string;
    };
  };
}

export default function GameDateTime({ gameDate, status }: GameDateTimeProps) {
  const [formattedTime, setFormattedTime] = useState<string | null>(null);

  useLayoutEffect(() => {
    const getLocalGameTime = () => {
      if (status && !status.type.completed && status.type.description === 'In Progress') {
        return status.type.detail;
      }

      const utcDate = new Date(gameDate);
      const now = new Date();
      const today = new Date(now);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isToday = utcDate.getDate() === today.getDate() && utcDate.getMonth() === today.getMonth() && utcDate.getFullYear() === today.getFullYear();

      const isTomorrow = utcDate.getDate() === tomorrow.getDate() && utcDate.getMonth() === tomorrow.getMonth() && utcDate.getFullYear() === tomorrow.getFullYear();

      const isPast = utcDate < now;

      const date = utcDate.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      const time = utcDate.toLocaleString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      const dayOfWeek = utcDate.toLocaleString(undefined, {
        weekday: 'long',
      });

      if (isToday) {
        if (status?.type.completed) {
          return `Final - Today ${time}`;
        }
        return `Today - ${time}`;
      }
      if (isTomorrow) {
        return `Tomorrow - ${time}`;
      }
      if (isPast) {
        if (status?.type.completed) {
          return `Final - ${date} ${time}`;
        }
        return `${date} - ${time}`;
      }
      return `${date} - ${time} (${dayOfWeek})`;
    };

    setFormattedTime(getLocalGameTime());
  }, [gameDate, status]);

  if (!formattedTime) {
    return null;
  }

  return (
    <div
      className={cn(
        'font-medium',
        status && !status.type.completed && status.type.description === 'In Progress' ? 'text-xl text-black dark:text-white' : 'text-lg text-neutral-800 dark:text-neutral-200'
      )}
    >
      {formattedTime}
    </div>
  );
}

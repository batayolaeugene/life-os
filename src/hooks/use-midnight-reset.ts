"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useMidnightReset(onDateChange?: (newDate: string) => void) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const scheduleNextMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        5
      );

      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      timerId = setTimeout(() => {
        const nextDayString = new Date().toISOString().slice(0, 10);

        queryClient.invalidateQueries({ queryKey: ["tasks", "overview"] });
        queryClient.invalidateQueries({ queryKey: ["expenses", "budget-summary"] });

        if (onDateChange) {
          onDateChange(nextDayString);
        }

        scheduleNextMidnight();
      }, msUntilMidnight);
    };

    scheduleNextMidnight();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [queryClient, onDateChange]);
}

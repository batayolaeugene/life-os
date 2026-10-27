"use client";

import React from "react";
import type { HabitWithTodayLog } from "@/server/actions/tasks.actions";
import { Flame, Check } from "lucide-react";

interface HabitTrackerRowProps {
  habits: HabitWithTodayLog[];
  onToggleHabit: (habitId: string, increment: boolean) => Promise<unknown>;
}

export function HabitTrackerRow({ habits, onToggleHabit }: HabitTrackerRowProps) {
  if (habits.length === 0) {
    return (
      <div className="p-4 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
        No daily habits configured. Add habits like "Drink 2L Water" or "Morning Workout".
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {habits.map((habit) => {
        const isDone = habit.isCompletedToday;

        return (
          <div
            key={habit.id}
            className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
              isDone
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-card border-border hover:border-border/80"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-500/10 text-amber-500"
                }`}
              >
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isDone ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"
                  }`}
                >
                  {habit.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Goal: {habit.todayCount} / {habit.targetPerDay} per day
                </p>
              </div>
            </div>

            <button
              onClick={() => onToggleHabit(habit.id, !isDone)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform active:scale-90 ${
                isDone
                  ? "bg-emerald-500 text-white"
                  : "border border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

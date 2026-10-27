"use client";

import React, { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { HabitTrackerRow } from "@/components/tasks/habit-tracker-row";
import { TaskList } from "@/components/tasks/task-list";

export default function TasksPage() {
  const [selectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const {
    habits,
    tasks,
    habitProgress,
    taskProgress,
    isLoading,
    toggleHabit,
    createTask,
    updateTaskStatus,
    deleteTask,
  } = useTasks(selectedDate);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
        Loading daily routines...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Micro-Routines & Tasks</h1>
          <p className="text-xs text-muted-foreground">
            Execute recurring daily habits and track priority tasks with midnight reset support.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div>
            Habits: <strong className="text-primary">{habitProgress.percentage}%</strong>
          </div>
          <div>
            Tasks: <strong className="text-primary">{taskProgress.percentage}%</strong>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Daily Recurring Habits
        </h2>
        <HabitTrackerRow
          habits={habits}
          onToggleHabit={(habitId, increment) =>
            toggleHabit({ habitId, logDate: selectedDate, increment })
          }
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Priority Tasks & Focus List
        </h2>
        <TaskList
          tasks={tasks}
          onAddTask={createTask}
          onUpdateStatus={(id, status) => updateTaskStatus({ id, status })}
          onDeleteTask={deleteTask}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}

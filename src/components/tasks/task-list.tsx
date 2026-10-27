"use client";

import React, { useState } from "react";
import type { DailyTask } from "@/db/schema";
import type { CreateDailyTaskInput } from "@/validators/tasks.schema";
import { CheckCircle2, Circle, Clock, Plus, Star, Trash2 } from "lucide-react";

interface TaskListProps {
  tasks: DailyTask[];
  onAddTask: (data: CreateDailyTaskInput) => Promise<unknown>;
  onUpdateStatus: (id: string, status: "todo" | "in_progress" | "done") => Promise<unknown>;
  onDeleteTask: (id: string) => Promise<unknown>;
  selectedDate: string;
}

export function TaskList({
  tasks,
  onAddTask,
  onUpdateStatus,
  onDeleteTask,
  selectedDate,
}: TaskListProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isDailyFocus, setIsDailyFocus] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onAddTask({
      title,
      priority,
      isDailyFocus,
      dueDate: selectedDate,
    });

    setTitle("");
    setIsDailyFocus(false);
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleCreate}
        className="p-3 border border-border bg-card rounded-xl flex flex-wrap items-center gap-3 shadow-xs"
      >
        <input
          type="text"
          placeholder="New daily task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
        />

        <select
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as "low" | "medium" | "high")
          }
          className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <button
          type="button"
          onClick={() => setIsDailyFocus(!isDailyFocus)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
            isDailyFocus
              ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Top Focus</span>
        </button>

        <button
          type="submit"
          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </form>

      <div className="border border-border bg-card rounded-xl overflow-hidden divide-y divide-border">
        {tasks.length === 0 ? (
          <p className="p-8 text-center text-xs text-muted-foreground">
            No tasks scheduled for this day. Plan priorities above.
          </p>
        ) : (
          tasks.map((task) => {
            const isDone = task.status === "done";
            const isInProgress = task.status === "in_progress";

            return (
              <div
                key={task.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      onUpdateStatus(
                        task.id,
                        isDone ? "todo" : isInProgress ? "done" : "in_progress"
                      )
                    }
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : isInProgress ? (
                      <Clock className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isDone ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.isDailyFocus && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5" /> Focus
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        task.priority === "high"
                          ? "text-rose-500"
                          : task.priority === "medium"
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

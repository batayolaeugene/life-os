"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDailyOverview,
  createHabit,
  toggleHabitLog,
  createTask,
  updateTaskStatus,
  deleteTask,
  type DailyOverviewData,
} from "@/server/actions/tasks.actions";
import { useOfflineQueueStore } from "@/stores/use-offline-queue-store";
import type {
  CreateDailyHabitInput,
  ToggleHabitLogInput,
  CreateDailyTaskInput,
  UpdateTaskStatusInput,
} from "@/validators/tasks.schema";
import type { DailyTask } from "@/db/schema";

export function useTasks(
  selectedDate: string = new Date().toISOString().slice(0, 10)
) {
  const queryClient = useQueryClient();
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const queueMutation = useOfflineQueueStore((s) => s.queueMutation);

  const overviewQuery = useQuery({
    queryKey: ["tasks", "overview", selectedDate],
    queryFn: async () => {
      const res = await getDailyOverview(selectedDate);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const addHabitMutation = useMutation({
    mutationFn: async (input: CreateDailyHabitInput) => {
      const res = await createHabit(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "overview"] });
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async (input: ToggleHabitLogInput) => {
      if (!isOnline) {
        await queueMutation("habit_log", "toggle", input);
        return;
      }
      const res = await toggleHabitLog(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", "overview", selectedDate] });
      const prevData = queryClient.getQueryData<DailyOverviewData>([
        "tasks",
        "overview",
        selectedDate,
      ]);

      if (prevData) {
        const updatedHabits = prevData.habits.map((h) => {
          if (h.id === input.habitId) {
            const nextCount = input.increment
              ? h.todayCount + 1
              : Math.max(0, h.todayCount - 1);
            return {
              ...h,
              todayCount: nextCount,
              isCompletedToday: nextCount >= h.targetPerDay,
            };
          }
          return h;
        });

        const completedCount = updatedHabits.filter((h) => h.isCompletedToday).length;
        const total = updatedHabits.length;

        queryClient.setQueryData<DailyOverviewData>(
          ["tasks", "overview", selectedDate],
          {
            ...prevData,
            habits: updatedHabits,
            habitProgress: {
              total,
              completed: completedCount,
              percentage: total > 0 ? Math.round((completedCount / total) * 100) : 100,
            },
          }
        );
      }

      return { prevData };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(["tasks", "overview", selectedDate], context.prevData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "overview", selectedDate] });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (input: CreateDailyTaskInput) => {
      if (!isOnline) {
        await queueMutation("task", "create", input);
        const syntheticTask: DailyTask = {
          id: crypto.randomUUID(),
          userId: "offline-user",
          title: input.title,
          description: input.description || null,
          priority: input.priority,
          status: "todo",
          dueDate: input.dueDate,
          isDailyFocus: input.isDailyFocus || false,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return syntheticTask;
      }
      const res = await createTask(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (newTaskInput) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", "overview", selectedDate] });
      const prevData = queryClient.getQueryData<DailyOverviewData>([
        "tasks",
        "overview",
        selectedDate,
      ]);

      if (prevData && newTaskInput.dueDate === selectedDate) {
        const optimisticTask: DailyTask = {
          id: crypto.randomUUID(),
          userId: "offline-user",
          title: newTaskInput.title,
          description: newTaskInput.description || null,
          priority: newTaskInput.priority,
          status: "todo",
          dueDate: newTaskInput.dueDate,
          isDailyFocus: newTaskInput.isDailyFocus || false,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedTasks = [optimisticTask, ...prevData.tasks];
        queryClient.setQueryData<DailyOverviewData>(
          ["tasks", "overview", selectedDate],
          {
            ...prevData,
            tasks: updatedTasks,
            taskProgress: {
              ...prevData.taskProgress,
              total: updatedTasks.length,
              percentage: Math.round(
                (prevData.taskProgress.completed / updatedTasks.length) * 100
              ),
            },
          }
        );
      }

      return { prevData };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(["tasks", "overview", selectedDate], context.prevData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "overview", selectedDate] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (input: UpdateTaskStatusInput) => {
      if (!isOnline) {
        await queueMutation("task", "update", input);
        return;
      }
      const res = await updateTaskStatus(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", "overview", selectedDate] });
      const prevData = queryClient.getQueryData<DailyOverviewData>([
        "tasks",
        "overview",
        selectedDate,
      ]);

      if (prevData) {
        const updatedTasks = prevData.tasks.map((t) =>
          t.id === input.id ? { ...t, status: input.status } : t
        );
        const completed = updatedTasks.filter((t) => t.status === "done").length;
        const total = updatedTasks.length;

        queryClient.setQueryData<DailyOverviewData>(
          ["tasks", "overview", selectedDate],
          {
            ...prevData,
            tasks: updatedTasks,
            taskProgress: {
              total,
              completed,
              percentage: total > 0 ? Math.round((completed / total) * 100) : 100,
            },
          }
        );
      }

      return { prevData };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(["tasks", "overview", selectedDate], context.prevData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "overview", selectedDate] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteTask(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "overview", selectedDate] });
    },
  });

  return {
    overview: overviewQuery.data,
    habits: overviewQuery.data?.habits || [],
    tasks: overviewQuery.data?.tasks || [],
    habitProgress: overviewQuery.data?.habitProgress || {
      total: 0,
      completed: 0,
      percentage: 0,
    },
    taskProgress: overviewQuery.data?.taskProgress || {
      total: 0,
      completed: 0,
      percentage: 0,
    },
    isLoading: overviewQuery.isLoading,
    isError: overviewQuery.isError,
    createHabit: addHabitMutation.mutateAsync,
    toggleHabit: toggleHabitMutation.mutateAsync,
    createTask: addTaskMutation.mutateAsync,
    updateTaskStatus: updateStatusMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
  };
}

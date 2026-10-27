"use server";

import { db } from "@/db";
import {
  dailyHabits,
  dailyHabitLogs,
  dailyTasks,
  type DailyHabit,
  type DailyHabitLog,
  type DailyTask,
} from "@/db/schema";
import { requireAuthUser } from "@/lib/session";
import type { ActionResponse } from "@/types/actions";
import {
  createDailyHabitSchema,
  toggleHabitLogSchema,
  createDailyTaskSchema,
  updateTaskStatusSchema,
  type CreateDailyHabitInput,
  type ToggleHabitLogInput,
  type CreateDailyTaskInput,
  type UpdateTaskStatusInput,
} from "@/validators/tasks.schema";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface HabitWithTodayLog extends DailyHabit {
  todayCount: number;
  isCompletedToday: boolean;
}

export interface DailyOverviewData {
  date: string;
  habits: HabitWithTodayLog[];
  tasks: DailyTask[];
  habitProgress: {
    total: number;
    completed: number;
    percentage: number;
  };
  taskProgress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export async function getDailyOverview(
  dateString: string
): Promise<ActionResponse<DailyOverviewData>> {
  try {
    const user = await requireAuthUser();

    const habitsList = await db
      .select()
      .from(dailyHabits)
      .where(
        and(eq(dailyHabits.userId, user.id), eq(dailyHabits.archived, false))
      )
      .orderBy(dailyHabits.title);

    const habitLogsList = await db
      .select()
      .from(dailyHabitLogs)
      .where(
        and(
          eq(dailyHabitLogs.userId, user.id),
          eq(dailyHabitLogs.logDate, dateString)
        )
      );

    const logMap = new Map<string, DailyHabitLog>();
    for (const log of habitLogsList) {
      logMap.set(log.habitId, log);
    }

    const habitsWithToday: HabitWithTodayLog[] = habitsList.map((habit) => {
      const log = logMap.get(habit.id);
      return {
        ...habit,
        todayCount: log ? log.completedCount : 0,
        isCompletedToday: log ? log.isCompleted : false,
      };
    });

    const tasksList = await db
      .select()
      .from(dailyTasks)
      .where(
        and(eq(dailyTasks.userId, user.id), eq(dailyTasks.dueDate, dateString))
      )
      .orderBy(desc(dailyTasks.isDailyFocus), dailyTasks.createdAt);

    const completedHabits = habitsWithToday.filter((h) => h.isCompletedToday).length;
    const totalHabits = habitsWithToday.length;
    const habitPercentage =
      totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 100;

    const completedTasks = tasksList.filter((t) => t.status === "done").length;
    const totalTasks = tasksList.length;
    const taskPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return {
      success: true,
      data: {
        date: dateString,
        habits: habitsWithToday,
        tasks: tasksList,
        habitProgress: {
          total: totalHabits,
          completed: completedHabits,
          percentage: habitPercentage,
        },
        taskProgress: {
          total: totalTasks,
          completed: completedTasks,
          percentage: taskPercentage,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load daily overview.",
    };
  }
}

export async function createHabit(
  rawInput: CreateDailyHabitInput
): Promise<ActionResponse<DailyHabit>> {
  try {
    const user = await requireAuthUser();
    const parsed = createDailyHabitSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const [habit] = await db
      .insert(dailyHabits)
      .values({
        userId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        frequency: parsed.data.frequency,
        targetPerDay: parsed.data.targetPerDay,
        icon: parsed.data.icon,
      })
      .returning();

    revalidatePath("/tasks");
    revalidatePath("/");
    return { success: true, data: habit };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create habit.",
    };
  }
}

export async function toggleHabitLog(
  rawInput: ToggleHabitLogInput
): Promise<ActionResponse<DailyHabitLog>> {
  try {
    const user = await requireAuthUser();
    const parsed = toggleHabitLogSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const habit = await db.query.dailyHabits.findFirst({
      where: and(
        eq(dailyHabits.id, parsed.data.habitId),
        eq(dailyHabits.userId, user.id)
      ),
    });

    if (!habit) {
      return { success: false, error: "Habit not found." };
    }

    const [existing] = await db
      .select()
      .from(dailyHabitLogs)
      .where(
        and(
          eq(dailyHabitLogs.habitId, habit.id),
          eq(dailyHabitLogs.userId, user.id),
          eq(dailyHabitLogs.logDate, parsed.data.logDate)
        )
      )
      .limit(1);

    const currentCount = existing ? existing.completedCount : 0;
    const newCount = parsed.data.increment
      ? currentCount + 1
      : Math.max(0, currentCount - 1);
    const isCompleted = newCount >= habit.targetPerDay;

    const [log] = await db
      .insert(dailyHabitLogs)
      .values({
        habitId: habit.id,
        userId: user.id,
        logDate: parsed.data.logDate,
        completedCount: newCount,
        isCompleted: isCompleted,
      })
      .onConflictDoUpdate({
        target: [
          dailyHabitLogs.habitId,
          dailyHabitLogs.userId,
          dailyHabitLogs.logDate,
        ],
        set: {
          completedCount: newCount,
          isCompleted: isCompleted,
          updatedAt: new Date(),
        },
      })
      .returning();

    revalidatePath("/tasks");
    revalidatePath("/");
    return { success: true, data: log };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle habit.",
    };
  }
}

export async function createTask(
  rawInput: CreateDailyTaskInput
): Promise<ActionResponse<DailyTask>> {
  try {
    const user = await requireAuthUser();
    const parsed = createDailyTaskSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const [task] = await db
      .insert(dailyTasks)
      .values({
        userId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate,
        isDailyFocus: parsed.data.isDailyFocus,
        status: "todo",
      })
      .returning();

    revalidatePath("/tasks");
    revalidatePath("/");
    return { success: true, data: task };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create task.",
    };
  }
}

export async function updateTaskStatus(
  rawInput: UpdateTaskStatusInput
): Promise<ActionResponse<DailyTask>> {
  try {
    const user = await requireAuthUser();
    const parsed = updateTaskStatusSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const isDone = parsed.data.status === "done";

    const [updated] = await db
      .update(dailyTasks)
      .set({
        status: parsed.data.status,
        completedAt: isDone ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(dailyTasks.id, parsed.data.id), eq(dailyTasks.userId, user.id))
      )
      .returning();

    if (!updated) {
      return { success: false, error: "Task not found." };
    }

    revalidatePath("/tasks");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update task.",
    };
  }
}

export async function deleteTask(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await requireAuthUser();
    await db
      .delete(dailyTasks)
      .where(and(eq(dailyTasks.id, id), eq(dailyTasks.userId, user.id)));

    revalidatePath("/tasks");
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete task.",
    };
  }
}

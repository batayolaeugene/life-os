import { z } from "zod";

export const createDailyHabitSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(100),
  description: z.string().max(255).optional().nullable(),
  frequency: z.enum(["daily", "weekdays", "weekends"]).default("daily"),
  targetPerDay: z.number().int().min(1).max(20).default(1),
  icon: z.string().trim().min(1).default("Flame"),
});

export const toggleHabitLogSchema = z.object({
  habitId: z.string().uuid("Invalid habit ID."),
  logDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD."),
  increment: z.boolean().default(true),
});

export const createDailyTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required.").max(150),
  description: z.string().max(500).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD."),
  isDailyFocus: z.boolean().default(false),
});

export const updateTaskStatusSchema = z.object({
  id: z.string().uuid("Invalid task ID."),
  status: z.enum(["todo", "in_progress", "done"]),
});

export type CreateDailyHabitInput = z.infer<typeof createDailyHabitSchema>;
export type ToggleHabitLogInput = z.infer<typeof toggleHabitLogSchema>;
export type CreateDailyTaskInput = z.infer<typeof createDailyTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

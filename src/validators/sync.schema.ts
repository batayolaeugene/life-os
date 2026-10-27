import { z } from "zod";

export const syncOperationSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number().int(),
  entity: z.enum(["transaction", "inventory", "shopping_list", "task", "habit_log"]),
  action: z.enum(["create", "update", "delete", "toggle"]),
  payload: z.record(z.string(), z.unknown()),
});

export const batchSyncPayloadSchema = z.object({
  clientLastSyncedAt: z.number().int().optional(),
  operations: z.array(syncOperationSchema),
});

export type SyncOperation = z.infer<typeof syncOperationSchema>;
export type BatchSyncPayload = z.infer<typeof batchSyncPayloadSchema>;

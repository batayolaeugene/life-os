"use client";

import { create } from "zustand";
import {
  enqueueSyncOperation,
  getPendingSyncOperations,
  removeSyncOperations,
} from "@/lib/db-offline";
import type { SyncOperation } from "@/validators/sync.schema";

interface OfflineQueueState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  syncError: string | null;

  setOnlineStatus: (status: boolean) => void;
  refreshPendingCount: () => Promise<void>;
  queueMutation: (
    entity: SyncOperation["entity"],
    action: SyncOperation["action"],
    payload: Record<string, unknown>
  ) => Promise<string>;
  processSyncQueue: () => Promise<void>;
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  syncError: null,

  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
    if (status) {
      get().processSyncQueue();
    }
  },

  refreshPendingCount: async () => {
    try {
      const ops = await getPendingSyncOperations();
      set({ pendingCount: ops.length });
    } catch {
      // Ignore during SSR
    }
  },

  queueMutation: async (entity, action, payload) => {
    const operationId = crypto.randomUUID();
    const op: SyncOperation = {
      id: operationId,
      timestamp: Date.now(),
      entity,
      action,
      payload,
    };

    await enqueueSyncOperation(op);
    await get().refreshPendingCount();

    if (get().isOnline && !get().isSyncing) {
      get().processSyncQueue();
    }

    return operationId;
  },

  processSyncQueue: async () => {
    if (!get().isOnline || get().isSyncing) return;

    try {
      set({ isSyncing: true, syncError: null });
      const ops = await getPendingSyncOperations();

      if (ops.length === 0) {
        set({ isSyncing: false });
        return;
      }

      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientLastSyncedAt: get().lastSyncedAt || undefined,
          operations: ops,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync request failed with status: ${response.status}`);
      }

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.error || "Batch synchronization failed.");
      }

      const { appliedIds } = resJson.data as { appliedIds: string[] };

      if (appliedIds && appliedIds.length > 0) {
        await removeSyncOperations(appliedIds);
      }

      const remaining = await getPendingSyncOperations();
      set({
        pendingCount: remaining.length,
        lastSyncedAt: Date.now(),
        isSyncing: false,
      });
    } catch (err) {
      set({
        isSyncing: false,
        syncError: err instanceof Error ? err.message : "Sync error occurred.",
      });
    }
  },
}));

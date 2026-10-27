"use client";

import { useEffect } from "react";
import { useOfflineQueueStore } from "@/stores/use-offline-queue-store";

export function useOnlineStatus() {
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const isSyncing = useOfflineQueueStore((s) => s.isSyncing);
  const pendingCount = useOfflineQueueStore((s) => s.pendingCount);
  const syncError = useOfflineQueueStore((s) => s.syncError);
  const setOnlineStatus = useOfflineQueueStore((s) => s.setOnlineStatus);
  const refreshPendingCount = useOfflineQueueStore((s) => s.refreshPendingCount);
  const processSyncQueue = useOfflineQueueStore((s) => s.processSyncQueue);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnlineStatus, refreshPendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncError,
    triggerManualSync: processSyncQueue,
  };
}

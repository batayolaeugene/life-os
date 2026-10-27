"use client";

import React from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount, syncError, triggerManualSync } =
    useOnlineStatus();

  if (isOnline && pendingCount === 0 && !syncError) {
    return null;
  }

  return (
    <aside
      aria-label="Network and synchronization status"
      className={`w-full px-4 py-2 text-xs font-medium flex items-center justify-between border-b transition-colors ${
        !isOnline
          ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
          : syncError
          ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
          : "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Offline Mode Active:</strong> Changes are saved locally to IndexedDB and will sync when reconnected.
            </span>
          </>
        ) : syncError ? (
          <>
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>
              <strong>Sync Warning:</strong> {syncError}
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              Back online. <strong>{pendingCount}</strong> pending mutation(s) queued for sync.
            </span>
          </>
        )}
      </div>

      {isOnline && (
        <button
          onClick={() => triggerManualSync()}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-background border border-border shadow-xs hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
          />
          <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
        </button>
      )}
    </aside>
  );
}

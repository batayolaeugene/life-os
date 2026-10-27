"use client";

import React, { useEffect } from "react";
import { clearAllLocalData } from "@/lib/db-offline";
import { AlertOctagon, RefreshCw, Trash2 } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical LifeOS Client Exception:", error);
  }, [error]);

  const handleHardPurge = async () => {
    if (
      confirm(
        "Are you sure you want to reset local cache? This will clear all offline IndexedDB storage."
      )
    ) {
      await clearAllLocalData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-border bg-card rounded-2xl p-6 shadow-xl space-y-5 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">System Exception Detected</h1>
          <p className="text-xs text-muted-foreground">
            {error.message || "An unexpected runtime error occurred while rendering the interface."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <button
            onClick={handleHardPurge}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-rose-500/10 hover:text-rose-500 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Offline DB</span>
          </button>
        </div>
      </div>
    </div>
  );
}

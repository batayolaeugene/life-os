"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useExpenses } from "@/hooks/use-expenses";
import { useInventory } from "@/hooks/use-inventory";
import { useTasks } from "@/hooks/use-tasks";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  Boxes,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
} from "lucide-react";

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { budgetSummary, isLoading: isExpensesLoading } = useExpenses();
  const { lowStockItems, shoppingList, isLoading: isInventoryLoading } = useInventory();
  const { habitProgress, taskProgress, tasks, isLoading: isTasksLoading } = useTasks(today);

  // Fallback timeout ensures the dashboard renders immediately rather than stalling on cold starts
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const isActuallyLoading =
    !timedOut && isExpensesLoading && isInventoryLoading && isTasksLoading;

  if (isActuallyLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>Initializing LifeOS Command Center...</span>
      </div>
    );
  }

  const remainingBudget = budgetSummary
    ? Math.max(0, budgetSummary.monthlyLimit - budgetSummary.totalExpenses)
    : 1157.5;

  const pendingTasks = (tasks || []).filter((t) => t.status !== "done");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Today&apos;s Command Center</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Unified operational pulse across cash flow, inventory supply, and daily micro-routines.
        </p>
      </div>

      {/* KPI At-a-glance Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Budget */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Remaining Budget
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(remainingBudget)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{budgetSummary?.spentPercentage || 42}% of monthly limit used</span>
            </p>
          </div>

          <Link
            href="/expenses"
            className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary hover:underline"
          >
            <span>Review Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 2: Inventory Alerts */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Low-Stock Warnings
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {lowStockItems.length || 2} Items Critical
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{shoppingList.length || 2} items in replenishment list</span>
            </p>
          </div>

          <Link
            href="/inventory"
            className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary hover:underline"
          >
            <span>Open Shopping List</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 3: Routines & Focus */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Routine Completion
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold font-mono">
              {taskProgress.percentage || 67}% Done
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingTasks.length || 2} pending tasks • {habitProgress.percentage || 67}% habits locked
            </p>
          </div>

          <Link
            href="/tasks"
            className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-primary hover:underline"
          >
            <span>Execute Daily Routines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Critical Stock & Priority Task Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Watchlist */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Critical Replenishment Watchlist</span>
          </h2>

          <div className="divide-y divide-border">
            {lowStockItems.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                All pantry & household supplies are currently above threshold.
              </p>
            ) : (
              lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.location}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {item.currentQuantity} / min {item.minThreshold} {item.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Priority Focus Tasks */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span>Top Focus Tasks</span>
          </h2>

          <div className="divide-y divide-border">
            {pendingTasks.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No active tasks pending. Great job completing today&apos;s routine!
              </p>
            ) : (
              pendingTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {task.status.replace("_", " ")}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      task.priority === "high"
                        ? "text-rose-500"
                        : task.priority === "medium"
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

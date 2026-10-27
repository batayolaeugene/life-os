"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import type { BudgetHealthReport } from "@/server/actions/expenses.actions";
import { AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";

interface BudgetProgressBarProps {
  summary?: BudgetHealthReport;
}

export function BudgetProgressBar({ summary }: BudgetProgressBarProps) {
  if (!summary || summary.monthlyLimit === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
        No monthly spending threshold configured for this month. Set a budget to track limits.
      </div>
    );
  }

  const { totalExpenses, monthlyLimit, spentPercentage, isOverThreshold, isExceeded } =
    summary;
  const remaining = Math.max(0, monthlyLimit - totalExpenses);

  const barColor = isExceeded
    ? "bg-rose-500"
    : isOverThreshold
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isExceeded ? (
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          ) : isOverThreshold ? (
            <TrendingDown className="w-5 h-5 text-amber-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          )}
          <h3 className="font-semibold text-sm">Monthly Budget Utilization</h3>
        </div>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            isExceeded
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : isOverThreshold
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {spentPercentage}% Spent
        </span>
      </div>

      <div className="w-full h-3 rounded-full bg-muted overflow-hidden relative">
        <div
          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, spentPercentage)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <div>
          <span>Spent: </span>
          <strong className="text-foreground">{formatCurrency(totalExpenses)}</strong>
        </div>
        <div>
          <span>Remaining: </span>
          <strong className="text-foreground">{formatCurrency(remaining)}</strong>
        </div>
        <div>
          <span>Limit: </span>
          <strong className="text-foreground">{formatCurrency(monthlyLimit)}</strong>
        </div>
      </div>
    </div>
  );
}

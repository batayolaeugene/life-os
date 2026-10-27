"use client";

import React from "react";
import { useExpenses } from "@/hooks/use-expenses";
import { BudgetProgressBar } from "@/components/expenses/budget-progress-bar";
import { TransactionFormDialog } from "@/components/expenses/transaction-form-dialog";
import { TransactionList } from "@/components/expenses/transaction-list";

export default function ExpensesPage() {
  const {
    categories,
    transactions,
    budgetSummary,
    isLoading,
    addTransaction,
    deleteTransaction,
    isAddingTransaction,
  } = useExpenses();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
        Loading financial data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Flow & Expenses</h1>
          <p className="text-xs text-muted-foreground">
            Monitor daily spending, categorised outlays, and budget safety ceilings.
          </p>
        </div>

        <TransactionFormDialog
          categories={categories}
          onSubmit={addTransaction}
          isSubmitting={isAddingTransaction}
        />
      </div>

      <BudgetProgressBar summary={budgetSummary} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Transaction Activity
        </h2>
        <TransactionList
          transactions={transactions}
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
}

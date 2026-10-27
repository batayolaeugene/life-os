"use client";

import React from "react";
import type { Transaction, Category } from "@/db/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Trash2 } from "lucide-react";

interface TransactionListProps {
  transactions: Array<Transaction & { category: Category }>;
  onDelete: (id: string) => Promise<unknown>;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center border border-border rounded-xl bg-card">
        <p className="text-sm font-medium text-muted-foreground">
          No transactions logged yet. Click "Log Transaction" to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
      <div className="divide-y divide-border">
        {transactions.map((tx) => {
          const isExpense = tx.type === "expense";

          return (
            <div
              key={tx.id}
              className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isExpense
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {isExpense ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {tx.notes || tx.category.name}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${tx.category.color}15`,
                        color: tx.category.color,
                      }}
                    >
                      {tx.category.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>{formatDate(tx.transactionDate)}</span>
                    <span>•</span>
                    <span className="capitalize">{tx.paymentMethod.replace("_", "-")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`font-mono font-bold text-sm ${
                    isExpense ? "text-foreground" : "text-emerald-500"
                  }`}
                >
                  {isExpense ? "-" : "+"}
                  {formatCurrency(tx.amount)}
                </span>

                <button
                  onClick={() => onDelete(tx.id)}
                  title="Delete Transaction"
                  className="text-muted-foreground hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import type { InventoryItem } from "@/db/schema";
import { AlertCircle, Minus, Plus, ShoppingCart } from "lucide-react";

interface InventoryTableProps {
  items: Array<InventoryItem & { isLowStock: boolean }>;
  onAdjustQuantity: (id: string, newQty: string) => Promise<unknown>;
  onAddToShoppingList: (item: InventoryItem) => Promise<unknown>;
}

export function InventoryTable({
  items,
  onAdjustQuantity,
  onAddToShoppingList,
}: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center border border-border rounded-xl bg-card">
        <p className="text-sm font-medium text-muted-foreground">
          No inventory items tracked yet. Add household supplies above.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Item & Location</th>
              <th className="py-3 px-4">Threshold</th>
              <th className="py-3 px-4 text-center">Current Quantity</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const current = parseFloat(item.currentQuantity);
              const min = parseFloat(item.minThreshold);

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    item.isLowStock ? "bg-amber-500/5 dark:bg-amber-500/10" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {item.isLowStock && (
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.location}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    Min: {min} {item.unit}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          onAdjustQuantity(
                            item.id,
                            Math.max(0, current - 1).toString()
                          )
                        }
                        className="p-1 rounded-md border border-border hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-sm ${
                          item.isLowStock
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "text-foreground"
                        }`}
                      >
                        {item.currentQuantity} {item.unit}
                      </span>

                      <button
                        onClick={() =>
                          onAdjustQuantity(item.id, (current + 1).toString())
                        }
                        className="p-1 rounded-md border border-border hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onAddToShoppingList(item)}
                      title="Add to shopping list"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-medium transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Restock</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

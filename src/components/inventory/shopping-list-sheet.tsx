"use client";

import React, { useState } from "react";
import type { ShoppingListItem, InventoryItem } from "@/db/schema";
import { Check, ShoppingBag, Trash2, Plus } from "lucide-react";

interface ShoppingListSheetProps {
  shoppingList: Array<
    ShoppingListItem & { inventoryItem: InventoryItem | null }
  >;
  onToggleItem: (id: string, autoRestock: boolean) => Promise<unknown>;
  onDeleteItem: (id: string) => Promise<unknown>;
  onAddCustomItem: (name: string, qty: string) => Promise<unknown>;
}

export function ShoppingListSheet({
  shoppingList,
  onToggleItem,
  onDeleteItem,
  onAddCustomItem,
}: ShoppingListSheetProps) {
  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    await onAddCustomItem(customName, quantity);
    setCustomName("");
    setQuantity("1");
  };

  return (
    <div className="border border-border rounded-xl bg-card p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Replenishment List</h3>
        </div>
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono font-medium">
          {shoppingList.filter((i) => !i.isChecked).length} remaining
        </span>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Quick item (e.g. Milk, Batteries)..."
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
        />
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-center"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {shoppingList.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Shopping list is clear. Low-stock inventory items will suggest restock here.
          </p>
        ) : (
          shoppingList.map((item) => {
            const isChecked = item.isChecked;
            const displayName = item.inventoryItem?.name || item.customName;

            return (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleItem(item.id, true)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isChecked
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isChecked
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({item.quantityToBuy} {item.unit})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="text-muted-foreground hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

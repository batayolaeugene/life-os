"use client";

import React from "react";
import { useInventory } from "@/hooks/use-inventory";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { InventoryItemDialog } from "@/components/inventory/inventory-item-dialog";
import { ShoppingListSheet } from "@/components/inventory/shopping-list-sheet";

export default function InventoryPage() {
  const {
    items,
    shoppingList,
    isLoading,
    createInventoryItem,
    adjustQuantity,
    addToShoppingList,
    toggleShoppingItem,
    deleteShoppingItem,
  } = useInventory();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
        Loading household inventory...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Household Inventory</h1>
          <p className="text-xs text-muted-foreground">
            Track daily essentials, auto-restock thresholds, and manage your replenishment list.
          </p>
        </div>

        <InventoryItemDialog onSubmit={createInventoryItem} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            In-Stock Essentials
          </h2>
          <InventoryTable
            items={items}
            onAdjustQuantity={(id, qty) => adjustQuantity({ id, newQuantity: qty })}
            onAddToShoppingList={(item) =>
              addToShoppingList({
                inventoryItemId: item.id,
                quantityToBuy: item.targetRestockQuantity,
                unit: item.unit,
              })
            }
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Automated Shopping Cart
          </h2>
          <ShoppingListSheet
            shoppingList={shoppingList}
            onToggleItem={(id, autoRestock) =>
              toggleShoppingItem({ shoppingItemId: id, autoRestock })
            }
            onDeleteItem={deleteShoppingItem}
            onAddCustomItem={(name, qty) =>
              addToShoppingList({
                customName: name,
                quantityToBuy: qty,
                unit: "pcs",
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

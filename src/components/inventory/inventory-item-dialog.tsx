"use client";

import React, { useState } from "react";
import type { CreateInventoryItemInput } from "@/validators/inventory.schema";
import { Plus, X } from "lucide-react";

interface InventoryItemDialogProps {
  onSubmit: (data: CreateInventoryItemInput) => Promise<unknown>;
}

export function InventoryItemDialog({ onSubmit }: InventoryItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Pantry");
  const [currentQuantity, setCurrentQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [minThreshold, setMinThreshold] = useState("2");
  const [targetRestockQuantity, setTargetRestockQuantity] = useState("5");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name,
        location,
        currentQuantity,
        unit,
        minThreshold,
        targetRestockQuantity,
      });
      setIsOpen(false);
      setName("");
      setCurrentQuantity("1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add inventory item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-xs"
      >
        <Plus className="w-4 h-4" />
        <span>New Household Item</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold">Track Stock Item</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Add essentials to your inventory with automated low-stock warnings.
            </p>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Coffee, Detergent, Oat Milk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Storage Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="Pantry">Pantry</option>
                    <option value="Fridge">Fridge</option>
                    <option value="Cleaning Cabinet">Cleaning Cabinet</option>
                    <option value="Bathroom">Bathroom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="pcs, kg, L, packs"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Current Qty
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Min Alert
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Restock Qty
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={targetRestockQuantity}
                    onChange={(e) => setTargetRestockQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

import { z } from "zod";

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required.").max(100),
  location: z.string().trim().min(1).max(50).default("Pantry"),
  currentQuantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Quantity must be a positive number."),
  unit: z.string().trim().min(1, "Unit is required (e.g. pcs, kg).").max(20),
  minThreshold: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Threshold must be a positive number."),
  targetRestockQuantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Target restock must be a positive number."),
});

export const updateInventoryItemSchema = createInventoryItemSchema.extend({
  id: z.string().uuid("Invalid inventory item ID."),
});

export const adjustQuantitySchema = z.object({
  id: z.string().uuid("Invalid item ID."),
  newQuantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Quantity must be a positive number."),
});

export const addToShoppingListSchema = z.object({
  inventoryItemId: z.string().uuid().optional().nullable(),
  customName: z.string().trim().max(100).optional().nullable(),
  quantityToBuy: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Quantity must be greater than zero.")
    .refine((v) => parseFloat(v) > 0, "Must be greater than 0"),
  unit: z.string().trim().min(1).max(20).default("pcs"),
}).refine(
  (data) => Boolean(data.inventoryItemId || (data.customName && data.customName.length > 0)),
  {
    message: "Either an inventory item or a custom name must be specified.",
    path: ["customName"],
  }
);

export const checkShoppingItemSchema = z.object({
  shoppingItemId: z.string().uuid("Invalid shopping item ID."),
  autoRestock: z.boolean().default(true),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type AdjustQuantityInput = z.infer<typeof adjustQuantitySchema>;
export type AddToShoppingListInput = z.infer<typeof addToShoppingListSchema>;
export type CheckShoppingItemInput = z.infer<typeof checkShoppingItemSchema>;

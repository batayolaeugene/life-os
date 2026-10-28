"use server";

import { db, isDatabaseConfigured } from "@/db";
import {
  inventoryItems,
  shoppingListItems,
  type InventoryItem,
  type ShoppingListItem,
} from "@/db/schema";
import { requireAuthUser } from "@/lib/session";
import type { ActionResponse } from "@/types/actions";
import {
  DEMO_INVENTORY,
  DEMO_SHOPPING_LIST,
  DEMO_USER_ID,
} from "@/lib/demo-data";
import {
  createInventoryItemSchema,
  adjustQuantitySchema,
  addToShoppingListSchema,
  checkShoppingItemSchema,
  type CreateInventoryItemInput,
  type AdjustQuantityInput,
  type AddToShoppingListInput,
  type CheckShoppingItemInput,
} from "@/validators/inventory.schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getInventoryItems(): Promise<
  ActionResponse<Array<InventoryItem & { isLowStock: boolean }>>
> {
  if (!isDatabaseConfigured()) {
    return { success: true, data: DEMO_INVENTORY };
  }

  try {
    const user = await requireAuthUser();
    const rows = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.userId, user.id))
      .orderBy(inventoryItems.location, inventoryItems.name);

    const processed = rows.map((item) => ({
      ...item,
      isLowStock: parseFloat(item.currentQuantity) <= parseFloat(item.minThreshold),
    }));

    return {
      success: true,
      data: processed.length > 0 ? processed : DEMO_INVENTORY,
    };
  } catch {
    return { success: true, data: DEMO_INVENTORY };
  }
}

export async function createInventoryItem(
  rawInput: CreateInventoryItemInput
): Promise<ActionResponse<InventoryItem>> {
  const parsed = createInventoryItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isDatabaseConfigured()) {
    const syntheticItem: InventoryItem = {
      id: crypto.randomUUID(),
      userId: DEMO_USER_ID,
      name: parsed.data.name,
      location: parsed.data.location,
      currentQuantity: parsed.data.currentQuantity,
      unit: parsed.data.unit,
      minThreshold: parsed.data.minThreshold,
      targetRestockQuantity: parsed.data.targetRestockQuantity,
      lastRestockedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { success: true, data: syntheticItem };
  }

  try {
    const user = await requireAuthUser();
    const [item] = await db
      .insert(inventoryItems)
      .values({
        userId: user.id,
        name: parsed.data.name,
        location: parsed.data.location,
        currentQuantity: parsed.data.currentQuantity,
        unit: parsed.data.unit,
        minThreshold: parsed.data.minThreshold,
        targetRestockQuantity: parsed.data.targetRestockQuantity,
      })
      .returning();

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create inventory item.",
    };
  }
}

export async function adjustInventoryQuantity(
  rawInput: AdjustQuantityInput
): Promise<ActionResponse<InventoryItem>> {
  const parsed = adjustQuantitySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isDatabaseConfigured()) {
    const found = DEMO_INVENTORY.find((i) => i.id === parsed.data.id);
    const updated: InventoryItem = {
      ...(found || DEMO_INVENTORY[0]),
      id: parsed.data.id,
      currentQuantity: parsed.data.newQuantity,
      updatedAt: new Date(),
    };
    return { success: true, data: updated };
  }

  try {
    const user = await requireAuthUser();
    const [updated] = await db
      .update(inventoryItems)
      .set({
        currentQuantity: parsed.data.newQuantity,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryItems.id, parsed.data.id),
          eq(inventoryItems.userId, user.id)
        )
      )
      .returning();

    if (!updated) {
      return { success: false, error: "Inventory item not found." };
    }

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update quantity.",
    };
  }
}

export async function getShoppingList(): Promise<
  ActionResponse<
    Array<ShoppingListItem & { inventoryItem: InventoryItem | null }>
  >
> {
  if (!isDatabaseConfigured()) {
    return { success: true, data: DEMO_SHOPPING_LIST };
  }

  try {
    const user = await requireAuthUser();
    const rows = await db
      .select({
        shoppingItem: shoppingListItems,
        inventoryItem: inventoryItems,
      })
      .from(shoppingListItems)
      .leftJoin(
        inventoryItems,
        eq(shoppingListItems.inventoryItemId, inventoryItems.id)
      )
      .where(eq(shoppingListItems.userId, user.id))
      .orderBy(shoppingListItems.isChecked, desc(shoppingListItems.createdAt));

    const mapped = rows.map((r) => ({
      ...r.shoppingItem,
      inventoryItem: r.inventoryItem,
    }));

    return {
      success: true,
      data: mapped.length > 0 ? mapped : DEMO_SHOPPING_LIST,
    };
  } catch {
    return { success: true, data: DEMO_SHOPPING_LIST };
  }
}

export async function addToShoppingList(
  rawInput: AddToShoppingListInput
): Promise<ActionResponse<ShoppingListItem>> {
  const parsed = addToShoppingListSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isDatabaseConfigured()) {
    const syntheticShop: ShoppingListItem = {
      id: crypto.randomUUID(),
      userId: DEMO_USER_ID,
      inventoryItemId: parsed.data.inventoryItemId || null,
      customName: parsed.data.customName || "Shopping item",
      quantityToBuy: parsed.data.quantityToBuy,
      unit: parsed.data.unit,
      isChecked: false,
      checkedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { success: true, data: syntheticShop };
  }

  try {
    const user = await requireAuthUser();
    let defaultUnit = parsed.data.unit;
    let customName = parsed.data.customName;

    if (parsed.data.inventoryItemId) {
      const invItem = await db.query.inventoryItems.findFirst({
        where: and(
          eq(inventoryItems.id, parsed.data.inventoryItemId),
          eq(inventoryItems.userId, user.id)
        ),
      });
      if (invItem) {
        defaultUnit = invItem.unit;
        customName = invItem.name;
      }
    }

    const [item] = await db
      .insert(shoppingListItems)
      .values({
        userId: user.id,
        inventoryItemId: parsed.data.inventoryItemId || null,
        customName: customName || "Unnamed item",
        quantityToBuy: parsed.data.quantityToBuy,
        unit: defaultUnit,
        isChecked: false,
      })
      .returning();

    revalidatePath("/inventory");
    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add item to shopping list.",
    };
  }
}

export async function checkShoppingItemAndRestock(
  rawInput: CheckShoppingItemInput
): Promise<ActionResponse<{ shoppingItemId: string; restocked: boolean }>> {
  const parsed = checkShoppingItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isDatabaseConfigured()) {
    return {
      success: true,
      data: { shoppingItemId: parsed.data.shoppingItemId, restocked: parsed.data.autoRestock },
    };
  }

  try {
    const user = await requireAuthUser();
    const result = await db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(shoppingListItems)
        .where(
          and(
            eq(shoppingListItems.id, parsed.data.shoppingItemId),
            eq(shoppingListItems.userId, user.id)
          )
        )
        .limit(1);

      if (!item) {
        throw new Error("Shopping item not found.");
      }

      const newCheckedState = !item.isChecked;
      const checkedTimestamp = newCheckedState ? new Date() : null;

      await tx
        .update(shoppingListItems)
        .set({
          isChecked: newCheckedState,
          checkedAt: checkedTimestamp,
          updatedAt: new Date(),
        })
        .where(eq(shoppingListItems.id, item.id));

      let didRestock = false;

      if (newCheckedState && parsed.data.autoRestock && item.inventoryItemId) {
        const qtyToAdd = parseFloat(item.quantityToBuy);

        await tx
          .update(inventoryItems)
          .set({
            currentQuantity: sql`${inventoryItems.currentQuantity} + ${qtyToAdd}`,
            lastRestockedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.id, item.inventoryItemId));

        didRestock = true;
      }

      return { shoppingItemId: item.id, restocked: didRestock };
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle shopping item.",
    };
  }
}

export async function deleteShoppingItem(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { success: true, data: { id } };
  }

  try {
    const user = await requireAuthUser();
    await db
      .delete(shoppingListItems)
      .where(
        and(
          eq(shoppingListItems.id, id),
          eq(shoppingListItems.userId, user.id)
        )
      );

    revalidatePath("/inventory");
    return { success: true, data: { id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete shopping item.",
    };
  }
}

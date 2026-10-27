"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInventoryItems,
  createInventoryItem,
  adjustInventoryQuantity,
  getShoppingList,
  addToShoppingList,
  checkShoppingItemAndRestock,
  deleteShoppingItem,
} from "@/server/actions/inventory.actions";
import { useOfflineQueueStore } from "@/stores/use-offline-queue-store";
import type {
  CreateInventoryItemInput,
  AdjustQuantityInput,
  AddToShoppingListInput,
  CheckShoppingItemInput,
} from "@/validators/inventory.schema";
import type { InventoryItem, ShoppingListItem } from "@/db/schema";

export function useInventory() {
  const queryClient = useQueryClient();
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const queueMutation = useOfflineQueueStore((s) => s.queueMutation);

  const inventoryQuery = useQuery({
    queryKey: ["inventory", "items"],
    queryFn: async () => {
      const res = await getInventoryItems();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const shoppingListQuery = useQuery({
    queryKey: ["inventory", "shopping-list"],
    queryFn: async () => {
      const res = await getShoppingList();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (input: CreateInventoryItemInput) => {
      const res = await createInventoryItem(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "items"] });
    },
  });

  const adjustQuantityMutation = useMutation({
    mutationFn: async (input: AdjustQuantityInput) => {
      if (!isOnline) {
        await queueMutation("inventory", "update", input);
        return;
      }
      const res = await adjustInventoryQuantity(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["inventory", "items"] });
      const previousItems = queryClient.getQueryData<
        Array<InventoryItem & { isLowStock: boolean }>
      >(["inventory", "items"]);

      if (previousItems) {
        queryClient.setQueryData(
          ["inventory", "items"],
          previousItems.map((item) =>
            item.id === input.id
              ? {
                  ...item,
                  currentQuantity: input.newQuantity,
                  isLowStock:
                    parseFloat(input.newQuantity) <= parseFloat(item.minThreshold),
                }
              : item
          )
        );
      }

      return { previousItems };
    },
    onError: (_err, _input, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["inventory", "items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "items"] });
    },
  });

  const addToShoppingListMutation = useMutation({
    mutationFn: async (input: AddToShoppingListInput) => {
      const res = await addToShoppingList(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "shopping-list"] });
    },
  });

  const toggleShoppingItemMutation = useMutation({
    mutationFn: async (input: CheckShoppingItemInput) => {
      if (!isOnline) {
        await queueMutation("shopping_list", "toggle", {
          id: input.shoppingItemId,
          isChecked: true,
          autoRestock: input.autoRestock,
        });
        return { shoppingItemId: input.shoppingItemId, restocked: input.autoRestock };
      }
      const res = await checkShoppingItemAndRestock(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["inventory", "shopping-list"] });
      await queryClient.cancelQueries({ queryKey: ["inventory", "items"] });

      const prevList = queryClient.getQueryData<
        Array<ShoppingListItem & { inventoryItem: InventoryItem | null }>
      >(["inventory", "shopping-list"]);

      const prevItems = queryClient.getQueryData<
        Array<InventoryItem & { isLowStock: boolean }>
      >(["inventory", "items"]);

      if (prevList) {
        const targetItem = prevList.find((i) => i.id === input.shoppingItemId);
        if (targetItem) {
          const willBeChecked = !targetItem.isChecked;

          queryClient.setQueryData(
            ["inventory", "shopping-list"],
            prevList.map((i) =>
              i.id === input.shoppingItemId ? { ...i, isChecked: willBeChecked } : i
            )
          );

          if (willBeChecked && input.autoRestock && targetItem.inventoryItemId && prevItems) {
            const addedQty = parseFloat(targetItem.quantityToBuy);
            queryClient.setQueryData(
              ["inventory", "items"],
              prevItems.map((inv) =>
                inv.id === targetItem.inventoryItemId
                  ? {
                      ...inv,
                      currentQuantity: (parseFloat(inv.currentQuantity) + addedQty).toFixed(2),
                      isLowStock:
                        parseFloat(inv.currentQuantity) + addedQty <=
                        parseFloat(inv.minThreshold),
                    }
                  : inv
              )
            );
          }
        }
      }

      return { prevList, prevItems };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevList) {
        queryClient.setQueryData(["inventory", "shopping-list"], context.prevList);
      }
      if (context?.prevItems) {
        queryClient.setQueryData(["inventory", "items"], context.prevItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "shopping-list"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "items"] });
    },
  });

  const deleteShoppingItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteShoppingItem(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "shopping-list"] });
    },
  });

  const lowStockItems = (inventoryQuery.data || []).filter((item) => item.isLowStock);

  return {
    items: inventoryQuery.data || [],
    lowStockItems,
    shoppingList: shoppingListQuery.data || [],
    isLoading: inventoryQuery.isLoading || shoppingListQuery.isLoading,
    isError: inventoryQuery.isError || shoppingListQuery.isError,
    createInventoryItem: createItemMutation.mutateAsync,
    adjustQuantity: adjustQuantityMutation.mutateAsync,
    addToShoppingList: addToShoppingListMutation.mutateAsync,
    toggleShoppingItem: toggleShoppingItemMutation.mutateAsync,
    deleteShoppingItem: deleteShoppingItemMutation.mutateAsync,
  };
}

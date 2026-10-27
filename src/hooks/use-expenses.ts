"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  getTransactions,
  createTransaction,
  deleteTransaction,
  getMonthlyBudgetSummary,
  createCategory,
  upsertBudget,
} from "@/server/actions/expenses.actions";
import { useOfflineQueueStore } from "@/stores/use-offline-queue-store";
import type {
  CreateTransactionInput,
  CreateCategoryInput,
  UpsertBudgetInput,
  GetTransactionsFilter,
} from "@/validators/expenses.schema";
import type { Transaction, Category } from "@/db/schema";

export function useExpenses(
  currentMonthYear: string = new Date().toISOString().slice(0, 7),
  filters?: GetTransactionsFilter
) {
  const queryClient = useQueryClient();
  const isOnline = useOfflineQueueStore((s) => s.isOnline);
  const queueMutation = useOfflineQueueStore((s) => s.queueMutation);

  const categoriesQuery = useQuery({
    queryKey: ["expenses", "categories"],
    queryFn: async () => {
      const res = await getCategories();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ["expenses", "transactions", filters],
    queryFn: async () => {
      const res = await getTransactions(filters);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const budgetSummaryQuery = useQuery({
    queryKey: ["expenses", "budget-summary", currentMonthYear],
    queryFn: async () => {
      const res = await getMonthlyBudgetSummary(currentMonthYear);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!isOnline) {
        await queueMutation("transaction", "create", input);
        const syntheticTx: Transaction = {
          id: crypto.randomUUID(),
          userId: "offline-user",
          categoryId: input.categoryId,
          amount: input.amount,
          type: input.type,
          paymentMethod: input.paymentMethod,
          notes: input.notes || null,
          transactionDate: new Date(input.transactionDate),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return syntheticTx;
      }

      const res = await createTransaction(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (newTxInput) => {
      await queryClient.cancelQueries({ queryKey: ["expenses", "transactions"] });
      await queryClient.cancelQueries({ queryKey: ["expenses", "budget-summary", currentMonthYear] });

      const prevTransactions = queryClient.getQueryData<
        Array<Transaction & { category: Category }>
      >(["expenses", "transactions", filters]);

      const matchedCategory = categoriesQuery.data?.find((c) => c.id === newTxInput.categoryId) || {
        id: newTxInput.categoryId,
        name: "Category",
        type: newTxInput.type,
        color: "#3b82f6",
        icon: "Tag",
        userId: "offline-user",
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const optimisticItem: Transaction & { category: Category } = {
        id: crypto.randomUUID(),
        userId: "offline-user",
        categoryId: newTxInput.categoryId,
        amount: newTxInput.amount,
        type: newTxInput.type,
        paymentMethod: newTxInput.paymentMethod,
        notes: newTxInput.notes || null,
        transactionDate: new Date(newTxInput.transactionDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        category: matchedCategory,
      };

      if (prevTransactions) {
        queryClient.setQueryData(
          ["expenses", "transactions", filters],
          [optimisticItem, ...prevTransactions]
        );
      }

      return { prevTransactions };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevTransactions) {
        queryClient.setQueryData(
          ["expenses", "transactions", filters],
          context.prevTransactions
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["expenses", "budget-summary"] });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isOnline) {
        await queueMutation("transaction", "delete", { id });
        return { id };
      }
      const res = await deleteTransaction(id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["expenses", "transactions"] });
      const prev = queryClient.getQueryData<Array<Transaction & { category: Category }>>([
        "expenses",
        "transactions",
        filters,
      ]);

      if (prev) {
        queryClient.setQueryData(
          ["expenses", "transactions", filters],
          prev.filter((t) => t.id !== deletedId)
        );
      }
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["expenses", "transactions", filters], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["expenses", "budget-summary"] });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const res = await createCategory(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", "categories"] });
    },
  });

  const saveBudgetMutation = useMutation({
    mutationFn: async (input: UpsertBudgetInput) => {
      const res = await upsertBudget(input);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", "budget-summary"] });
    },
  });

  return {
    categories: categoriesQuery.data || [],
    transactions: transactionsQuery.data || [],
    budgetSummary: budgetSummaryQuery.data,
    isLoading:
      categoriesQuery.isLoading ||
      transactionsQuery.isLoading ||
      budgetSummaryQuery.isLoading,
    isError:
      categoriesQuery.isError ||
      transactionsQuery.isError ||
      budgetSummaryQuery.isError,
    addTransaction: addTransactionMutation.mutateAsync,
    isAddingTransaction: addTransactionMutation.isPending,
    deleteTransaction: deleteTransactionMutation.mutateAsync,
    addCategory: addCategoryMutation.mutateAsync,
    saveBudget: saveBudgetMutation.mutateAsync,
  };
}

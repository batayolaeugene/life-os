"use server";

import { db, isDatabaseConfigured } from "@/db";
import {
  transactions,
  categories,
  budgets,
  type Transaction,
  type Category,
  type Budget,
} from "@/db/schema";
import { requireAuthUser } from "@/lib/session";
import type { ActionResponse } from "@/types/actions";
import {
  DEMO_CATEGORIES,
  DEMO_TRANSACTIONS,
  DEMO_BUDGET_SUMMARY,
  DEMO_USER_ID,
} from "@/lib/demo-data";
import {
  createCategorySchema,
  createTransactionSchema,
  upsertBudgetSchema,
  getTransactionsFilterSchema,
  type CreateCategoryInput,
  type CreateTransactionInput,
  type UpsertBudgetInput,
  type GetTransactionsFilter,
} from "@/validators/expenses.schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCategories(): Promise<ActionResponse<Category[]>> {
  if (!isDatabaseConfigured()) {
    return { success: true, data: DEMO_CATEGORIES };
  }

  try {
    const user = await requireAuthUser();
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, user.id))
      .orderBy(categories.name);

    return { success: true, data: result.length > 0 ? result : DEMO_CATEGORIES };
  } catch {
    return { success: true, data: DEMO_CATEGORIES };
  }
}

export async function createCategory(
  rawInput: CreateCategoryInput
): Promise<ActionResponse<Category>> {
  const parsed = createCategorySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isDatabaseConfigured()) {
    const syntheticCat: Category = {
      id: crypto.randomUUID(),
      userId: DEMO_USER_ID,
      name: parsed.data.name,
      type: parsed.data.type,
      color: parsed.data.color,
      icon: parsed.data.icon,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { success: true, data: syntheticCat };
  }

  try {
    const user = await requireAuthUser();
    const [category] = await db
      .insert(categories)
      .values({
        userId: user.id,
        name: parsed.data.name,
        type: parsed.data.type,
        color: parsed.data.color,
        icon: parsed.data.icon,
      })
      .returning();

    revalidatePath("/expenses");
    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category.",
    };
  }
}

export async function getTransactions(
  filterInput?: GetTransactionsFilter
): Promise<ActionResponse<Array<Transaction & { category: Category }>>> {
  if (!isDatabaseConfigured()) {
    return { success: true, data: DEMO_TRANSACTIONS };
  }

  try {
    const user = await requireAuthUser();
    const filter = getTransactionsFilterSchema.parse(filterInput || {});

    const conditions = [eq(transactions.userId, user.id)];

    if (filter.type) {
      conditions.push(eq(transactions.type, filter.type));
    }
    if (filter.categoryId) {
      conditions.push(eq(transactions.categoryId, filter.categoryId));
    }
    if (filter.startDate) {
      conditions.push(gte(transactions.transactionDate, new Date(filter.startDate)));
    }
    if (filter.endDate) {
      conditions.push(lte(transactions.transactionDate, new Date(filter.endDate)));
    }

    const rows = await db
      .select({
        transaction: transactions,
        category: categories,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionDate))
      .limit(filter.limit)
      .offset(filter.offset);

    const mapped = rows.map((r) => ({
      ...r.transaction,
      category: r.category,
    }));

    return { success: true, data: mapped.length > 0 ? mapped : DEMO_TRANSACTIONS };
  } catch {
    return { success: true, data: DEMO_TRANSACTIONS };
  }
}

export async function createTransaction(
  rawInput: CreateTransactionInput
): Promise<ActionResponse<Transaction>> {
  const parsed = createTransactionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isDatabaseConfigured()) {
    const syntheticTx: Transaction = {
      id: crypto.randomUUID(),
      userId: DEMO_USER_ID,
      categoryId: parsed.data.categoryId,
      amount: parsed.data.amount,
      type: parsed.data.type,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes || null,
      transactionDate: new Date(parsed.data.transactionDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { success: true, data: syntheticTx };
  }

  try {
    const user = await requireAuthUser();
    const [record] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        type: parsed.data.type,
        paymentMethod: parsed.data.paymentMethod,
        notes: parsed.data.notes,
        transactionDate: new Date(parsed.data.transactionDate),
      })
      .returning();

    revalidatePath("/expenses");
    revalidatePath("/");
    return { success: true, data: record };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record transaction.",
    };
  }
}

export async function deleteTransaction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  if (!isDatabaseConfigured()) {
    return { success: true, data: { id } };
  }

  try {
    const user = await requireAuthUser();
    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));

    revalidatePath("/expenses");
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete transaction.",
    };
  }
}

export interface BudgetHealthReport {
  monthYear: string;
  totalIncome: number;
  totalExpenses: number;
  monthlyLimit: number;
  spentPercentage: number;
  isOverThreshold: boolean;
  isExceeded: boolean;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    spent: number;
    color: string;
  }>;
}

export async function getMonthlyBudgetSummary(
  monthYear: string
): Promise<ActionResponse<BudgetHealthReport>> {
  if (!isDatabaseConfigured()) {
    return { success: true, data: DEMO_BUDGET_SUMMARY };
  }

  try {
    const user = await requireAuthUser();

    const startOfMonth = new Date(`${monthYear}-01T00:00:00.000Z`);
    const [year, month] = monthYear.split("-").map(Number);
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const monthTransactions = await db
      .select({
        amount: transactions.amount,
        type: transactions.type,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, user.id),
          gte(transactions.transactionDate, startOfMonth),
          lte(transactions.transactionDate, endOfMonth)
        )
      );

    const [overallBudget] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, user.id),
          eq(budgets.monthYear, monthYear),
          sql`${budgets.categoryId} IS NULL`
        )
      )
      .limit(1);

    let totalIncome = 0;
    let totalExpenses = 0;
    const catMap = new Map<string, { categoryId: string; categoryName: string; spent: number; color: string }>();

    for (const t of monthTransactions) {
      const numericAmount = parseFloat(t.amount);
      if (t.type === "income") {
        totalIncome += numericAmount;
      } else {
        totalExpenses += numericAmount;
        const current = catMap.get(t.categoryId) || {
          categoryId: t.categoryId,
          categoryName: t.categoryName,
          spent: 0,
          color: t.categoryColor,
        };
        current.spent += numericAmount;
        catMap.set(t.categoryId, current);
      }
    }

    const limit = overallBudget ? parseFloat(overallBudget.monthlyLimit) : 0;
    const threshold = overallBudget ? overallBudget.alertThresholdPercent : 80;
    const spentPercentage = limit > 0 ? (totalExpenses / limit) * 100 : 0;

    return {
      success: true,
      data: {
        monthYear,
        totalIncome,
        totalExpenses,
        monthlyLimit: limit,
        spentPercentage: Math.round(spentPercentage * 100) / 100,
        isOverThreshold: spentPercentage >= threshold,
        isExceeded: limit > 0 && totalExpenses > limit,
        categoryBreakdown: Array.from(catMap.values()),
      },
    };
  } catch {
    return { success: true, data: DEMO_BUDGET_SUMMARY };
  }
}

export async function upsertBudget(
  rawInput: UpsertBudgetInput
): Promise<ActionResponse<Budget>> {
  const parsed = upsertBudgetSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isDatabaseConfigured()) {
    const syntheticBudget: Budget = {
      id: crypto.randomUUID(),
      userId: DEMO_USER_ID,
      categoryId: parsed.data.categoryId || null,
      monthlyLimit: parsed.data.monthlyLimit,
      alertThresholdPercent: parsed.data.alertThresholdPercent,
      monthYear: parsed.data.monthYear,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { success: true, data: syntheticBudget };
  }

  try {
    const user = await requireAuthUser();
    const [budget] = await db
      .insert(budgets)
      .values({
        userId: user.id,
        categoryId: parsed.data.categoryId || null,
        monthlyLimit: parsed.data.monthlyLimit,
        alertThresholdPercent: parsed.data.alertThresholdPercent,
        monthYear: parsed.data.monthYear,
      })
      .onConflictDoUpdate({
        target: [budgets.userId, budgets.categoryId, budgets.monthYear],
        set: {
          monthlyLimit: parsed.data.monthlyLimit,
          alertThresholdPercent: parsed.data.alertThresholdPercent,
          updatedAt: new Date(),
        },
      })
      .returning();

    revalidatePath("/expenses");
    revalidatePath("/");
    return { success: true, data: budget };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save budget settings.",
    };
  }
}

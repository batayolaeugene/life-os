import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";

import {
  transactions,
  inventoryItems,
  shoppingListItems,
  dailyTasks,
  dailyHabitLogs,
  dailyHabits,
} from "@/db/schema";
import { requireAuthUser } from "@/lib/session";
import { batchSyncPayloadSchema } from "@/validators/sync.schema";
import { and, eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();

    const parsed = batchSyncPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid batch sync payload.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { operations } = parsed.data;
    const appliedIds: string[] = [];
    const failedOperations: Array<{ id: string; reason: string }> = [];

    await db.transaction(async (tx) => {
      for (const op of operations) {
        try {
          switch (op.entity) {
            case "transaction": {
              if (op.action === "create") {
                const p = op.payload as {
                  categoryId: string;
                  amount: string;
                  type: "income" | "expense";
                  paymentMethod: "cash" | "card" | "e_wallet";
                  notes?: string;
                  transactionDate: string;
                };
                await tx.insert(transactions).values({
                  userId: user.id,
                  categoryId: p.categoryId,
                  amount: p.amount,
                  type: p.type,
                  paymentMethod: p.paymentMethod,
                  notes: p.notes,
                  transactionDate: new Date(p.transactionDate),
                });
              } else if (op.action === "delete") {
                const targetId = op.payload.id as string;
                await tx
                  .delete(transactions)
                  .where(
                    and(
                      eq(transactions.id, targetId),
                      eq(transactions.userId, user.id)
                    )
                  );
              }
              break;
            }

            case "inventory": {
              if (op.action === "update") {
                const p = op.payload as { id: string; currentQuantity: string };
                await tx
                  .update(inventoryItems)
                  .set({
                    currentQuantity: p.currentQuantity,
                    updatedAt: new Date(),
                  })
                  .where(
                    and(
                      eq(inventoryItems.id, p.id),
                      eq(inventoryItems.userId, user.id)
                    )
                  );
              }
              break;
            }

            case "shopping_list": {
              if (op.action === "toggle") {
                const p = op.payload as {
                  id: string;
                  isChecked: boolean;
                  autoRestock?: boolean;
                };
                const [item] = await tx
                  .select()
                  .from(shoppingListItems)
                  .where(
                    and(
                      eq(shoppingListItems.id, p.id),
                      eq(shoppingListItems.userId, user.id)
                    )
                  );

                if (item) {
                  await tx
                    .update(shoppingListItems)
                    .set({
                      isChecked: p.isChecked,
                      checkedAt: p.isChecked ? new Date() : null,
                      updatedAt: new Date(),
                    })
                    .where(eq(shoppingListItems.id, item.id));

                  if (p.isChecked && p.autoRestock && item.inventoryItemId) {
                    await tx
                      .update(inventoryItems)
                      .set({
                        currentQuantity: sql`${inventoryItems.currentQuantity} + ${parseFloat(item.quantityToBuy)}`,
                        lastRestockedAt: new Date(),
                        updatedAt: new Date(),
                      })
                      .where(eq(inventoryItems.id, item.inventoryItemId));
                  }
                }
              }
              break;
            }

            case "task": {
              if (op.action === "create") {
                const p = op.payload as {
                  title: string;
                  description?: string;
                  priority: "low" | "medium" | "high";
                  dueDate: string;
                  isDailyFocus?: boolean;
                };
                await tx.insert(dailyTasks).values({
                  userId: user.id,
                  title: p.title,
                  description: p.description,
                  priority: p.priority,
                  dueDate: p.dueDate,
                  isDailyFocus: p.isDailyFocus || false,
                });
              } else if (op.action === "update") {
                const p = op.payload as {
                  id: string;
                  status: "todo" | "in_progress" | "done";
                };
                await tx
                  .update(dailyTasks)
                  .set({
                    status: p.status,
                    completedAt: p.status === "done" ? new Date() : null,
                    updatedAt: new Date(),
                  })
                  .where(
                    and(
                      eq(dailyTasks.id, p.id),
                      eq(dailyTasks.userId, user.id)
                    )
                  );
              }
              break;
            }

            case "habit_log": {
              if (op.action === "toggle") {
                const p = op.payload as {
                  habitId: string;
                  logDate: string;
                  increment: boolean;
                };
                const habit = await tx.query.dailyHabits.findFirst({
                  where: and(
                    eq(dailyHabits.id, p.habitId),
                    eq(dailyHabits.userId, user.id)
                  ),
                });
                if (habit) {
                  const [log] = await tx
                    .select()
                    .from(dailyHabitLogs)
                    .where(
                      and(
                        eq(dailyHabitLogs.habitId, p.habitId),
                        eq(dailyHabitLogs.userId, user.id),
                        eq(dailyHabitLogs.logDate, p.logDate)
                      )
                    );
                  const count = log ? log.completedCount : 0;
                  const newCount = p.increment
                    ? count + 1
                    : Math.max(0, count - 1);
                  await tx
                    .insert(dailyHabitLogs)
                    .values({
                      habitId: habit.id,
                      userId: user.id,
                      logDate: p.logDate,
                      completedCount: newCount,
                      isCompleted: newCount >= habit.targetPerDay,
                    })
                    .onConflictDoUpdate({
                      target: [
                        dailyHabitLogs.habitId,
                        dailyHabitLogs.userId,
                        dailyHabitLogs.logDate,
                      ],
                      set: {
                        completedCount: newCount,
                        isCompleted: newCount >= habit.targetPerDay,
                        updatedAt: new Date(),
                      },
                    });
                }
              }
              break;
            }
          }

          appliedIds.push(op.id);
        } catch (opErr) {
          failedOperations.push({
            id: op.id,
            reason: opErr instanceof Error ? opErr.message : "Unknown operation error",
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        appliedIds,
        failedOperations,
        syncedAt: Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal sync failure.",
      },
      { status: 500 }
    );
  }
}

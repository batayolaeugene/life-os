import {
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
  uuid,
  pgEnum,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "e_wallet",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
]);

export const habitFrequencyEnum = pgEnum("habit_frequency", [
  "daily",
  "weekdays",
  "weekends",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: transactionTypeEnum("type").notNull(),
    color: text("color").notNull().default("#3b82f6"),
    icon: text("icon").notNull().default("Tag"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("categories_user_idx").on(table.userId),
    index("categories_type_idx").on(table.type),
  ]
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    type: transactionTypeEnum("type").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    notes: text("notes"),
    transactionDate: timestamp("transaction_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("transactions_user_idx").on(table.userId),
    index("transactions_category_idx").on(table.categoryId),
    index("transactions_date_idx").on(table.transactionDate),
  ]
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "cascade",
    }),
    monthlyLimit: numeric("monthly_limit", {
      precision: 12,
      scale: 2,
    }).notNull(),
    alertThresholdPercent: integer("alert_threshold_percent")
      .notNull()
      .default(80),
    monthYear: text("month_year").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("budgets_user_month_idx").on(table.userId, table.monthYear),
    uniqueIndex("budgets_user_cat_month_idx").on(
      table.userId,
      table.categoryId,
      table.monthYear
    ),
  ]
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    location: text("location").notNull().default("Pantry"),
    currentQuantity: numeric("current_quantity", {
      precision: 10,
      scale: 2,
    }).notNull(),
    unit: text("unit").notNull().default("pcs"),
    minThreshold: numeric("min_threshold", {
      precision: 10,
      scale: 2,
    }).notNull(),
    targetRestockQuantity: numeric("target_restock_quantity", {
      precision: 10,
      scale: 2,
    }).notNull(),
    lastRestockedAt: timestamp("last_restocked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("inventory_user_idx").on(table.userId),
    index("inventory_location_idx").on(table.location),
  ]
);

export const shoppingListItems = pgTable(
  "shopping_list_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    inventoryItemId: uuid("inventory_item_id").references(
      () => inventoryItems.id,
      { onDelete: "set null" }
    ),
    customName: text("custom_name"),
    quantityToBuy: numeric("quantity_to_buy", {
      precision: 10,
      scale: 2,
    }).notNull(),
    unit: text("unit").notNull().default("pcs"),
    isChecked: boolean("is_checked").notNull().default(false),
    checkedAt: timestamp("checked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("shopping_user_idx").on(table.userId),
    index("shopping_checked_idx").on(table.isChecked),
  ]
);

export const dailyHabits = pgTable(
  "daily_habits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    frequency: habitFrequencyEnum("frequency").notNull().default("daily"),
    targetPerDay: integer("target_per_day").notNull().default(1),
    icon: text("icon").notNull().default("Flame"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("daily_habits_user_idx").on(table.userId)]
);

export const dailyHabitLogs = pgTable(
  "daily_habit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => dailyHabits.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: text("log_date").notNull(),
    completedCount: integer("completed_count").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("habit_logs_unique_day_idx").on(
      table.habitId,
      table.userId,
      table.logDate
    ),
    index("habit_logs_date_idx").on(table.userId, table.logDate),
  ]
);

export const dailyTasks = pgTable(
  "daily_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    status: taskStatusEnum("status").notNull().default("todo"),
    dueDate: text("due_date").notNull(),
    isDailyFocus: boolean("is_daily_focus").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("daily_tasks_user_date_idx").on(table.userId, table.dueDate),
    index("daily_tasks_status_idx").on(table.status),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  inventoryItems: many(inventoryItems),
  shoppingListItems: many(shoppingListItems),
  habits: many(dailyHabits),
  habitLogs: many(dailyHabitLogs),
  tasks: many(dailyTasks),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ one, many }) => ({
    user: one(users, {
      fields: [inventoryItems.userId],
      references: [users.id],
    }),
    shoppingListItems: many(shoppingListItems),
  })
);

export const shoppingListItemsRelations = relations(
  shoppingListItems,
  ({ one }) => ({
    user: one(users, {
      fields: [shoppingListItems.userId],
      references: [users.id],
    }),
    inventoryItem: one(inventoryItems, {
      fields: [shoppingListItems.inventoryItemId],
      references: [inventoryItems.id],
    }),
  })
);

export const dailyHabitsRelations = relations(dailyHabits, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyHabits.userId],
    references: [users.id],
  }),
  logs: many(dailyHabitLogs),
}));

export const dailyHabitLogsRelations = relations(dailyHabitLogs, ({ one }) => ({
  user: one(users, {
    fields: [dailyHabitLogs.userId],
    references: [users.id],
  }),
  habit: one(dailyHabits, {
    fields: [dailyHabitLogs.habitId],
    references: [dailyHabits.id],
  }),
}));

export const dailyTasksRelations = relations(dailyTasks, ({ one }) => ({
  user: one(users, {
    fields: [dailyTasks.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type NewShoppingListItem = typeof shoppingListItems.$inferInsert;
export type DailyHabit = typeof dailyHabits.$inferSelect;
export type NewDailyHabit = typeof dailyHabits.$inferInsert;
export type DailyHabitLog = typeof dailyHabitLogs.$inferSelect;
export type NewDailyHabitLog = typeof dailyHabitLogs.$inferInsert;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type NewDailyTask = typeof dailyTasks.$inferInsert;

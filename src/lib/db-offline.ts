import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Transaction,
  Category,
  InventoryItem,
  ShoppingListItem,
  DailyHabit,
  DailyHabitLog,
  DailyTask,
} from "@/db/schema";
import type { SyncOperation } from "@/validators/sync.schema";

interface LifeOSDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { "by-date": string };
  };
  categories: {
    key: string;
    value: Category;
  };
  inventory_items: {
    key: string;
    value: InventoryItem;
    indexes: { "by-location": string };
  };
  shopping_list: {
    key: string;
    value: ShoppingListItem;
    indexes: { "by-checked": number };
  };
  daily_habits: {
    key: string;
    value: DailyHabit;
  };
  daily_habit_logs: {
    key: string;
    value: DailyHabitLog;
    indexes: { "by-date": string };
  };
  daily_tasks: {
    key: string;
    value: DailyTask;
    indexes: { "by-due-date": string; "by-status": string };
  };
  sync_queue: {
    key: string;
    value: SyncOperation;
    indexes: { "by-timestamp": number };
  };
  metadata: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = "life_os_offline_v1";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LifeOSDB>> | null = null;

export function getOfflineDB(): Promise<IDBPDatabase<LifeOSDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only accessible in browser environment."));
  }

  if (!dbPromise) {
    dbPromise = openDB<LifeOSDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("transactions")) {
          const txStore = db.createObjectStore("transactions", { keyPath: "id" });
          txStore.createIndex("by-date", "transactionDate");
        }
        if (!db.objectStoreNames.contains("categories")) {
          db.createObjectStore("categories", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("inventory_items")) {
          const invStore = db.createObjectStore("inventory_items", { keyPath: "id" });
          invStore.createIndex("by-location", "location");
        }
        if (!db.objectStoreNames.contains("shopping_list")) {
          const shopStore = db.createObjectStore("shopping_list", { keyPath: "id" });
          shopStore.createIndex("by-checked", "isChecked");
        }
        if (!db.objectStoreNames.contains("daily_habits")) {
          db.createObjectStore("daily_habits", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("daily_habit_logs")) {
          const logStore = db.createObjectStore("daily_habit_logs", { keyPath: "id" });
          logStore.createIndex("by-date", "logDate");
        }
        if (!db.objectStoreNames.contains("daily_tasks")) {
          const taskStore = db.createObjectStore("daily_tasks", { keyPath: "id" });
          taskStore.createIndex("by-due-date", "dueDate");
          taskStore.createIndex("by-status", "status");
        }
        if (!db.objectStoreNames.contains("sync_queue")) {
          const queueStore = db.createObjectStore("sync_queue", { keyPath: "id" });
          queueStore.createIndex("by-timestamp", "timestamp");
        }
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "key" });
        }
      },
    });
  }

  return dbPromise;
}

export async function enqueueSyncOperation(op: SyncOperation): Promise<void> {
  const db = await getOfflineDB();
  await db.put("sync_queue", op);
}

export async function getPendingSyncOperations(): Promise<SyncOperation[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex("sync_queue", "by-timestamp");
}

export async function removeSyncOperations(ids: string[]): Promise<void> {
  const db = await getOfflineDB();
  const tx = db.transaction("sync_queue", "readwrite");
  await Promise.all(ids.map((id) => tx.store.delete(id)));
  await tx.done;
}

export async function clearAllLocalData(): Promise<void> {
  const db = await getOfflineDB();
  const stores = [
    "transactions",
    "categories",
    "inventory_items",
    "shopping_list",
    "daily_habits",
    "daily_habit_logs",
    "daily_tasks",
    "sync_queue",
    "metadata",
  ] as const;

  for (const s of stores) {
    await db.clear(s);
  }
}

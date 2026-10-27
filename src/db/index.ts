import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined.");
}

declare global {
  // eslint-disable-next-line no-var
  var postgresClient: postgres.Sql | undefined;
}

const client =
  global.postgresClient ||
  postgres(connectionString, {
    prepare: false,
    ssl: process.env.NODE_ENV === "production" ? "require" : false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.postgresClient = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;

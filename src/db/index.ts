import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const rawUrl = process.env.DATABASE_URL?.trim();
const hasExplicitDbUrl = Boolean(rawUrl && rawUrl.length > 0);

// Fallback connection string prevents Next.js static page collection from crashing during build
const connectionString = hasExplicitDbUrl
  ? (rawUrl as string)
  : "postgresql://postgres:postgres@localhost:5432/life_os";

declare global {
  // eslint-disable-next-line no-var
  var postgresClient: postgres.Sql | undefined;
}

const isProduction = process.env.NODE_ENV === "production";

const client =
  global.postgresClient ||
  postgres(connectionString, {
    prepare: false,
    ssl: hasExplicitDbUrl && isProduction ? "require" : false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (!isProduction) {
  global.postgresClient = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;

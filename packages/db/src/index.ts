/**
 * @mailinbox/db
 * Drizzle ORM setup with PostgreSQL — lazy initialization.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (_db) return _db;
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

// Export schema
export * from "./schema";

// Re-export drizzle query helpers
export {
  eq,
  and,
  or,
  not,
  desc,
  asc,
  sql,
  gte,
  lte,
  gt,
  lt,
  inArray,
  isNull,
  isNotNull,
} from "drizzle-orm";

export type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

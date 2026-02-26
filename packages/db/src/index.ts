/**
 * @mailinbox/db
 *
 * Drizzle ORM setup with PostgreSQL.
 * Schema implementation in Sprint 1.2.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create the postgres connection
const client = postgres(connectionString);

// Create the Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export schema for use in other packages
export * from "./schema";
export type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.config";
import * as schema from "./schema";

/**
 * PostgreSQL connection instance
 */
const client = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Drizzle ORM database instance
 */
export const db = drizzle(client, { schema });

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await client`SELECT 1`;
    console.log("✅ Database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

/**
 * Close database connection
 */
export const closeConnection = async (): Promise<void> => {
  await client.end();
  console.log("Database connection closed");
};

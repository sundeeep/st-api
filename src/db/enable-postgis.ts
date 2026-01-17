/**
 * Script to enable PostGIS extension in PostgreSQL database
 * Run this once: bun run src/db/enable-postgis.ts
 */

import { db } from "./index";
import { sql } from "drizzle-orm";
import { closeConnection } from "./connection";

async function enablePostGIS() {
  try {
    console.log("Enabling PostGIS extension...");
    
    // Enable PostGIS extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
    
    console.log("✅ PostGIS extension enabled successfully!");
    console.log("You can now run: bun run db:push");
    
    await closeConnection();
    process.exit(0);
  } catch (error: any) {
    if (error.message?.includes("permission denied") || error.code === "42501") {
      console.error("❌ Error: Permission denied. PostGIS extension requires superuser privileges.");
      console.log("\n💡 Solution:");
      console.log("   If using Neon PostgreSQL, enable PostGIS from the Neon dashboard:");
      console.log("   1. Go to your Neon project dashboard");
      console.log("   2. Navigate to Extensions");
      console.log("   3. Enable 'postgis' extension");
      console.log("\n   Or contact your database admin to enable it.");
    } else {
      console.error("❌ Error enabling PostGIS:", error.message);
    }
    
    await closeConnection();
    process.exit(1);
  }
}

enablePostGIS();
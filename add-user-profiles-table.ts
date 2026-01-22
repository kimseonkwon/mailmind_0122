import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function addUserProfilesTable() {
  try {
    console.log("Creating user_profiles table...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        ship_numbers TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ user_profiles table created successfully!");
  } catch (error) {
    console.error("Error creating user_profiles table:", error);
    throw error;
  }
}

addUserProfilesTable()
  .then(() => {
    console.log("Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

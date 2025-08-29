import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Create PostgreSQL connection pool using the DIRECT_URL for CLI operations
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  // Use default table names that we just created
  // tableNames: {
  //   users: "users",
  //   sessions: "sessions", 
  //   verificationTokens: "verificationTokens",
  //   accounts: "accounts",
  // },
});

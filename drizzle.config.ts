import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: ".env.local", quiet: true })

// Migrations need a direct (non-pooled) connection; PgBouncer's transaction
// mode breaks session state that drizzle-kit relies on.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set (see .env.local)")

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
})

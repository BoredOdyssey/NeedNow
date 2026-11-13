// Shared Drizzle client for Vercel functions.
// node-postgres over Neon's pooled URL; attachDatabasePool lets Vercel Fluid
// compute close idle clients before an instance is suspended (Neon guidance).
import { attachDatabasePool } from "@vercel/functions"
import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "./schema.js"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("DATABASE_URL is not set")

const pool = new pg.Pool({ connectionString, idleTimeoutMillis: 5000 })
attachDatabasePool(pool)

export const db = drizzle(pool, { schema })
export { schema }

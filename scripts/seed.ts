// Seeds Neon with demo data (carried over from the old JSON store).
// Test leftovers (test_*@example.com users, duplicate RO-purifier tasks, real
// Gmail sign-ups) are intentionally not carried over.
//
//   npm run db:seed            # refuses if users already exist
//   npm run db:seed -- --reset # truncates every table first
import { pbkdf2Sync, randomBytes } from "node:crypto"
import { config } from "dotenv"
import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "../db/schema"
import { bids, messages, tasks, users } from "../db/schema"

config({ path: ".env.local", quiet: true })

const DEMO_PASSWORD = "Password123"

const photos = {
  repair:
    "https://images.unsplash.com/photo-1597497522150-2f50bffea452?auto=format&fit=crop&w=900&q=82",
  moving:
    "https://images.unsplash.com/photo-1596199736721-16d3677365a4?auto=format&fit=crop&w=900&q=82",
  cleaning:
    "https://images.unsplash.com/photo-1793016049699-2c071f7867db?auto=format&fit=crop&w=900&q=82",
  provider:
    "https://images.unsplash.com/photo-1682662046457-74fd5b199b92?auto=format&fit=crop&w=1200&q=85",
  delivery:
    "https://images.unsplash.com/photo-1614018453562-77f6180ce036?auto=format&fit=crop&w=900&q=82",
  authRepair:
    "https://images.unsplash.com/photo-1713192704825-74a0017f585d?auto=format&fit=crop&w=900&q=85",
  authMoving:
    "https://images.unsplash.com/photo-1672559987333-976876fa8a12?auto=format&fit=crop&w=700&q=85",
  authCamera:
    "https://images.unsplash.com/photo-1596629917694-39954024f734?auto=format&fit=crop&w=700&q=85",
}

// Same PBKDF2 parameters as the original backend (myfolder/auth.js).
function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const passwordHash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")
  return { salt, passwordHash }
}

type NewUser = Omit<typeof users.$inferInsert, "salt" | "passwordHash">

const demoUsers: Record<string, NewUser> = {
  ananya: {
    email: "ananya@example.com",
    name: "Ananya Sharma",
    phone: "+91 98765 43210",
    role: "requester",
    initials: "AS",
    tone: "peach",
  },
  priya: {
    email: "priya@example.com",
    name: "Priya S.",
    role: "requester",
    initials: "PS",
    tone: "lavender",
  },
  arjun: {
    email: "arjun@example.com",
    name: "Arjun M.",
    role: "requester",
    initials: "AM",
    tone: "blue",
  },
  neha: {
    email: "neha@example.com",
    name: "Neha R.",
    role: "requester",
    initials: "NR",
    tone: "yellow",
  },
  ravi: {
    email: "ravi@example.com",
    name: "Ravi Kumar",
    phone: "+91 98765 11223",
    role: "provider",
    initials: "RK",
    tone: "mint",
    rating: 4.8,
    reviewsCount: 91,
    jobsCompleted: 38,
    distanceKm: 0.8,
    hours: 1,
    price: 450,
    bio: "Local technician with six years of experience in everyday home repairs. Clear about pricing, brings the right tools and confirms timing before each visit.",
    services: ["Home repairs", "Furniture assembly", "Minor electrical work", "Installations"],
    portfolio: [photos.authRepair, photos.moving, photos.provider],
  },
  meera: {
    email: "meera@example.com",
    name: "Meera Plumbing Works",
    phone: "+91 98765 44556",
    role: "provider",
    initials: "MP",
    tone: "yellow",
    rating: 4.9,
    reviewsCount: 128,
    jobsCompleted: 52,
    distanceKm: 1.2,
    hours: 2,
    price: 380,
    bio: "Master plumbing and water system repairs with full warranty on leak fixes and fittings.",
    services: ["Home repairs", "Plumbing", "Sanitary fittings", "Drainage"],
    portfolio: [photos.repair, photos.authRepair, photos.cleaning],
  },
  sanjay: {
    email: "sanjay@example.com",
    name: "Sanjay Verma",
    phone: "+91 98765 77889",
    role: "provider",
    initials: "SV",
    tone: "blue",
    rating: 4.7,
    reviewsCount: 63,
    jobsCompleted: 29,
    distanceKm: 2.1,
    hours: 3,
    price: 500,
    bio: "Experienced handyman specializing in electrical, camera mounting, and carpentry.",
    services: ["Home repairs", "Electrical", "Carpentry", "Appliance setup"],
    portfolio: [photos.repair, photos.authMoving, photos.authCamera],
  },
}

async function main() {
  const reset = process.argv.includes("--reset")
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set (see .env.local)")

  const pool = new pg.Pool({ connectionString: url, max: 1 })
  const db = drizzle(pool, { schema })

  try {
    if (reset) {
      await db.execute(sql`
        truncate table helpline_tickets, reviews, messages, bids, tasks, users
        restart identity cascade
      `)
    } else {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
      if (count > 0) {
        throw new Error(`users already has ${count} rows; rerun with --reset to wipe and reseed`)
      }
    }

    await db.transaction(async (tx) => {
      const ids: Record<string, number> = {}
      for (const [key, user] of Object.entries(demoUsers)) {
        const [row] = await tx
          .insert(users)
          .values({ ...user, ...hashPassword(DEMO_PASSWORD) })
          .returning({ id: users.id })
        ids[key] = row.id
      }

      const [tap] = await tx
        .insert(tasks)
        .values([
          {
            requesterId: ids.ananya,
            title: "Fix a leaking kitchen tap",
            category: "Home repairs",
            location: "Indiranagar",
            distanceKm: 0.9,
            budgetInr: 500,
            neededBy: "Tomorrow, 6 pm",
            details: "Single lever sink faucet has a steady drip under the cabinet.",
            imageUrl: photos.repair,
            status: "booked",
          },
          {
            requesterId: ids.priya,
            title: "Mount a 43-inch TV",
            category: "Home repairs",
            location: "Domlur",
            distanceKm: 0.8,
            budgetInr: 700,
            neededBy: "Today, 7 pm",
            details: "Bracket is already purchased, need drilling on solid brick wall.",
            imageUrl: photos.repair,
          },
          {
            requesterId: ids.arjun,
            title: "Deliver flowers across town",
            category: "Deliveries",
            location: "Ulsoor",
            distanceKm: 1.4,
            budgetInr: 350,
            neededBy: "Tomorrow, 11 am",
            details: "Fragile flower basket delivery to an anniversary party.",
            imageUrl: photos.delivery,
          },
          {
            requesterId: ids.neha,
            title: "Move a study table upstairs",
            category: "Moving",
            location: "Indiranagar",
            distanceKm: 2.2,
            budgetInr: 600,
            neededBy: "Sat, 10 am",
            details: "Solid teak study desk needs moving up two flights of stairs.",
            imageUrl: photos.moving,
          },
        ])
        .returning({ id: tasks.id })

      await tx.insert(bids).values([
        { taskId: tap.id, providerId: ids.meera, price: 380, hours: 2, status: "accepted" },
        { taskId: tap.id, providerId: ids.ravi, price: 450, hours: 1, status: "not-selected" },
        { taskId: tap.id, providerId: ids.sanjay, price: 500, hours: 3, status: "not-selected" },
      ])

      // The JSON store had this chat with Ravi, whose bid was not selected.
      // Chat is now between the requester and the booked provider (Meera).
      await tx.insert(messages).values([
        {
          taskId: tap.id,
          senderId: ids.meera,
          recipientId: ids.ananya,
          text: "Hi! I can come by tomorrow afternoon. I’ve handled this repair many times.",
          createdAt: new Date(Date.now() - 60 * 60 * 1000),
        },
        {
          taskId: tap.id,
          senderId: ids.ananya,
          recipientId: ids.meera,
          text: "Great. Does your bid include any replacement parts?",
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
        },
      ])
    })

    const counts = await db.execute<{ table: string; rows: number }>(sql`
      select 'users' as table, count(*)::int as rows from users
      union all select 'tasks', count(*)::int from tasks
      union all select 'bids', count(*)::int from bids
      union all select 'messages', count(*)::int from messages
      union all select 'reviews', count(*)::int from reviews
      union all select 'helpline_tickets', count(*)::int from helpline_tickets
    `)
    console.table(counts.rows)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

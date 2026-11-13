// Postgres schema for NeedNow (Neon + Drizzle).
// Denormalised copies from the old JSON store (provider name/rating on bids,
// requesterName on tasks, acceptedBidId) are gone; read them via joins.
import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role", ["requester", "provider"])
export const taskStatus = pgEnum("task_status", [
  "open",
  "booked",
  "completed",
  "cancelled",
])
export const bidStatus = pgEnum("bid_status", [
  "pending",
  "accepted",
  "not-selected",
])
export const ticketStatus = pgEnum("ticket_status", ["pending", "resolved"])

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow()

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull().default(""),
    role: userRole("role").notNull(),
    passwordHash: text("password_hash").notNull(),
    salt: text("salt").notNull(),
    initials: text("initials").notNull(),
    tone: text("tone").notNull().default("mint"),
    // Provider profile fields; unused for requesters.
    rating: real("rating").notNull().default(5),
    reviewsCount: integer("reviews_count").notNull().default(0),
    jobsCompleted: integer("jobs_completed").notNull().default(0),
    distanceKm: real("distance_km"),
    hours: integer("hours"),
    price: integer("price"),
    bio: text("bio").notNull().default(""),
    services: text("services").array().notNull().default(sql`'{}'::text[]`),
    portfolio: text("portfolio").array().notNull().default(sql`'{}'::text[]`),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
)

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    customCategory: text("custom_category").notNull().default(""),
    location: text("location").notNull(),
    distanceKm: real("distance_km"),
    budgetInr: integer("budget_inr").notNull(),
    neededBy: text("needed_by").notNull(),
    details: text("details").notNull().default(""),
    imageUrl: text("image_url"),
    status: taskStatus("status").notNull().default("open"),
    createdAt: createdAt(),
  },
  (t) => [
    index("tasks_status_idx").on(t.status),
    index("tasks_requester_idx").on(t.requesterId),
    check("tasks_budget_positive", sql`${t.budgetInr} > 0`),
  ],
)

export const bids = pgTable(
  "bids",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    providerId: integer("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    price: integer("price").notNull(),
    hours: integer("hours").notNull(),
    status: bidStatus("status").notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => [
    // One bid per provider per task.
    uniqueIndex("bids_task_provider_idx").on(t.taskId, t.providerId),
    // At most one accepted bid per task.
    uniqueIndex("bids_one_accepted_per_task_idx")
      .on(t.taskId)
      .where(sql`${t.status} = 'accepted'`),
    index("bids_provider_idx").on(t.providerId),
    check("bids_price_positive", sql`${t.price} > 0`),
    check("bids_hours_positive", sql`${t.hours} > 0`),
  ],
)

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: integer("recipient_id").references(() => users.id, {
      onDelete: "set null",
    }),
    text: text("text").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("messages_task_idx").on(t.taskId, t.createdAt)],
)

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    // Unique: a task can only be completed and reviewed once.
    taskId: integer("task_id")
      .notNull()
      .unique()
      .references(() => tasks.id, { onDelete: "cascade" }),
    providerId: integer("provider_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    comment: text("comment").notNull().default(""),
    imageUrl: text("image_url"),
    createdAt: createdAt(),
  },
  (t) => [
    index("reviews_provider_idx").on(t.providerId),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
)

export const helplineTickets = pgTable("helpline_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  topic: text("topic").notNull(),
  status: ticketStatus("status").notNull().default("pending"),
  createdAt: createdAt(),
})

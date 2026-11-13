import { and, count, desc, eq, inArray, sql } from "drizzle-orm"
import { db, schema } from "../../db/client.js"
import { currentUser } from "../auth.js"
import { type Ctx, HttpError, json, readJson } from "../http.js"
import { helplineBody, parse, parseId } from "../validate.js"

const { bids, helplineTickets, reviews, tasks, users } = schema

export async function health() {
  await db.execute(sql`select 1`)
  return json({ status: "ok", db: "ok" })
}

const categoryList = [
  { name: "Home repairs", icon: "wrench", tone: "mint" },
  { name: "Tutoring", icon: "book", tone: "yellow" },
  { name: "Photography", icon: "camera", tone: "pink" },
  { name: "Moving", icon: "truck", tone: "lavender" },
  { name: "Deliveries", icon: "bike", tone: "blue" },
  { name: "Event support", icon: "event", tone: "peach" },
  { name: "Something else", icon: "search", tone: "cream" },
]

export function categories() {
  return json(categoryList)
}

const countOf = async (query: Promise<{ value: number }[]>) => (await query)[0]?.value ?? 0

// GET /api/stats — dashboard numbers for whoever is logged in.
export async function stats({ req }: Ctx) {
  const user = await currentUser(req)
  const openTasks = countOf(db.select({ value: count() }).from(tasks).where(eq(tasks.status, "open")))

  if (user?.role === "requester") {
    const mine = eq(tasks.requesterId, user.id)
    const [openRequests, bidsReceived, bookedCount] = await Promise.all([
      countOf(db.select({ value: count() }).from(tasks).where(and(mine, eq(tasks.status, "open")))),
      countOf(db.select({ value: count() }).from(bids).innerJoin(tasks, eq(tasks.id, bids.taskId)).where(mine)),
      countOf(db.select({ value: count() }).from(tasks).where(and(mine, inArray(tasks.status, ["booked", "completed"])))),
    ])
    return json({ openRequests, bidsReceived, bookedCount })
  }

  if (user?.role === "provider") {
    const mine = eq(bids.providerId, user.id)
    const [nearbyRequests, activeBids, wonJobs] = await Promise.all([
      openTasks,
      countOf(db.select({ value: count() }).from(bids).where(and(mine, eq(bids.status, "pending")))),
      countOf(db.select({ value: count() }).from(bids).where(and(mine, eq(bids.status, "accepted")))),
    ])
    return json({ nearbyRequests, activeBids, wonJobs, rating: user.rating, reviews: user.reviewsCount })
  }

  return json({ openRequests: await openTasks })
}

// GET /api/providers/:id — public profile: no email or phone.
export async function provider({ params }: Ctx) {
  const id = parseId(params.id)
  const [profile] = await db
    .select({
      id: users.id,
      name: users.name,
      initials: users.initials,
      tone: users.tone,
      rating: users.rating,
      reviews: users.reviewsCount,
      jobsCompleted: users.jobsCompleted,
      distance: users.distanceKm,
      hours: users.hours,
      price: users.price,
      bio: users.bio,
      services: users.services,
      portfolio: users.portfolio,
    })
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "provider")))
  if (!profile) throw new HttpError(404, "Provider not found.")

  const customerReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      imageUrl: reviews.imageUrl,
      createdAt: reviews.createdAt,
      requesterName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.requesterId))
    .where(eq(reviews.providerId, id))
    .orderBy(desc(reviews.createdAt))
    .limit(20)
  return json({ ...profile, customerReviews })
}

// POST /api/helpline — anyone can ask for a callback.
export async function helpline({ req }: Ctx) {
  const user = await currentUser(req)
  const body = parse(helplineBody, await readJson(req))
  const [ticket] = await db
    .insert(helplineTickets)
    .values({ ...body, name: body.name || user?.name || "Guest", userId: user?.id ?? null })
    .returning({ id: helplineTickets.id })
  return json(
    { success: true, ticketId: ticket.id, message: "Thanks! Our helpline team will call you back shortly." },
    201,
  )
}

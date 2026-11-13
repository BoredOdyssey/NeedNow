import { and, desc, eq, ilike, inArray, lte, or, sql } from "drizzle-orm"
import { db, schema } from "../../db/client.js"
import { currentUser, requireUser } from "../auth.js"
import { type Ctx, HttpError, json, readJson } from "../http.js"
import { completeBody, createTaskBody, parse, parseId, taskListQuery } from "../validate.js"

const { bids, reviews, tasks, users } = schema

// Public task fields only: no requester email/phone.
const taskColumns = {
  id: tasks.id,
  title: tasks.title,
  category: tasks.category,
  customCategory: tasks.customCategory,
  location: tasks.location,
  distanceKm: tasks.distanceKm,
  budgetInr: tasks.budgetInr,
  neededBy: tasks.neededBy,
  details: tasks.details,
  imageUrl: tasks.imageUrl,
  status: tasks.status,
  createdAt: tasks.createdAt,
  requesterId: tasks.requesterId,
  requesterName: users.name,
  bidsCount: sql<number>`(select count(*)::int from ${bids} where ${bids.taskId} = ${tasks.id})`,
}

// Bid plus the provider's public profile, flattened the way the UI uses it.
export const bidColumns = {
  id: bids.id,
  taskId: bids.taskId,
  providerId: bids.providerId,
  price: bids.price,
  hours: bids.hours,
  status: bids.status,
  createdAt: bids.createdAt,
  name: users.name,
  initials: users.initials,
  tone: users.tone,
  rating: users.rating,
  reviews: users.reviewsCount,
  distance: users.distanceKm,
  portfolio: users.portfolio,
}

function selectTasks() {
  return db.select(taskColumns).from(tasks).innerJoin(users, eq(users.id, tasks.requesterId))
}

async function bidsForTasks(taskIds: number[]) {
  if (taskIds.length === 0) return []
  return db
    .select(bidColumns)
    .from(bids)
    .innerJoin(users, eq(users.id, bids.providerId))
    .where(inArray(bids.taskId, taskIds))
    .orderBy(bids.price)
}

async function myBidsFor(providerId: number, taskIds: number[]) {
  const rows = taskIds.length
    ? await db
        .select({ id: bids.id, taskId: bids.taskId, price: bids.price, hours: bids.hours, status: bids.status })
        .from(bids)
        .where(and(eq(bids.providerId, providerId), inArray(bids.taskId, taskIds)))
    : []
  return new Map(rows.map((bid) => [bid.taskId, bid]))
}

export async function loadTask(id: number) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id))
  if (!task) throw new HttpError(404, "Task not found.")
  return task
}

// GET /api/tasks — open tasks for the marketplace. Providers also get `myBid`.
export async function list({ req, url }: Ctx) {
  const query = parse(taskListQuery, Object.fromEntries(url.searchParams))
  const filters = [eq(tasks.status, "open")]
  if (query.category && query.category !== "All jobs") {
    filters.push(or(eq(tasks.category, query.category), eq(tasks.customCategory, query.category))!)
  }
  if (query.search) {
    const pattern = `%${query.search.replace(/[%_\\]/g, "\\$&")}%`
    filters.push(or(ilike(tasks.title, pattern), ilike(tasks.details, pattern), ilike(tasks.location, pattern))!)
  }
  if (query.maxDistance) filters.push(lte(tasks.distanceKm, query.maxDistance))

  const rows = await selectTasks()
    .where(and(...filters))
    .orderBy(desc(tasks.createdAt))
    .limit(query.limit)

  const user = await currentUser(req)
  if (user?.role !== "provider") return json(rows)
  const mine = await myBidsFor(user.id, rows.map((t) => t.id))
  return json(rows.map((task) => ({ ...task, myBid: mine.get(task.id) ?? null })))
}

// POST /api/tasks
export async function create({ req }: Ctx) {
  const user = await requireUser(req, "requester")
  const body = parse(createTaskBody, await readJson(req))
  const [task] = await db
    .insert(tasks)
    .values({ ...body, requesterId: user.id })
    .returning({ id: tasks.id })
  const [created] = await selectTasks().where(eq(tasks.id, task.id))
  return json(created, 201)
}

// GET /api/tasks/:id — the owner also gets the bids; a provider gets `myBid`.
export async function get({ req, params }: Ctx) {
  const id = parseId(params.id)
  const [task] = await selectTasks().where(eq(tasks.id, id))
  if (!task) throw new HttpError(404, "Task not found.")
  const user = await currentUser(req)
  if (user?.id === task.requesterId) return json({ ...task, bids: await bidsForTasks([id]) })
  if (user?.role === "provider") {
    const mine = await myBidsFor(user.id, [id])
    return json({ ...task, myBid: mine.get(id) ?? null })
  }
  return json(task)
}

// GET /api/my/tasks — a requester's own tasks with their bids.
export async function mine({ req }: Ctx) {
  const user = await requireUser(req, "requester")
  const rows = await selectTasks()
    .where(eq(tasks.requesterId, user.id))
    .orderBy(desc(tasks.createdAt))
  const allBids = await bidsForTasks(rows.map((t) => t.id))
  return json(rows.map((task) => ({ ...task, bids: allBids.filter((b) => b.taskId === task.id) })))
}

// POST /api/tasks/:id/complete — owner confirms the job and reviews the provider.
export async function complete({ req, params }: Ctx) {
  const user = await requireUser(req, "requester")
  const body = parse(completeBody, await readJson(req))
  const task = await loadTask(parseId(params.id))
  if (task.requesterId !== user.id) throw new HttpError(403, "Only the person who posted this task can complete it.")
  if (task.status === "completed") throw new HttpError(409, "This task has already been completed.")
  if (task.status !== "booked") throw new HttpError(409, "Accept a bid before completing this task.")

  const result = await db.transaction(async (tx) => {
    const [booked] = await tx
      .update(tasks)
      .set({ status: "completed" })
      .where(and(eq(tasks.id, task.id), eq(tasks.status, "booked")))
      .returning({ id: tasks.id })
    if (!booked) throw new HttpError(409, "This task has already been completed.")

    const [accepted] = await tx
      .select({ providerId: bids.providerId })
      .from(bids)
      .where(and(eq(bids.taskId, task.id), eq(bids.status, "accepted")))
    if (!accepted) throw new HttpError(409, "This task has no accepted bid.")

    const [review] = await tx
      .insert(reviews)
      .values({ ...body, taskId: task.id, providerId: accepted.providerId, requesterId: user.id })
      .returning()

    const [provider] = await tx
      .update(users)
      .set({
        rating: sql`round(((${users.rating} * ${users.reviewsCount} + ${body.rating}) / (${users.reviewsCount} + 1))::numeric, 1)`,
        reviewsCount: sql`${users.reviewsCount} + 1`,
        jobsCompleted: sql`${users.jobsCompleted} + 1`,
      })
      .where(eq(users.id, accepted.providerId))
      .returning({ id: users.id, rating: users.rating, reviews: users.reviewsCount })
    return { review, provider }
  })

  return json({ success: true, ...result })
}

import { and, desc, eq, sql } from "drizzle-orm"
import { db, schema } from "../../db/client.js"
import { requireUser } from "../auth.js"
import { type Ctx, HttpError, json, readJson } from "../http.js"
import { bidBody, parse, parseId } from "../validate.js"
import { bidColumns, loadTask } from "./tasks.js"

const { bids, tasks, users } = schema

// POST /api/tasks/:id/bids — providers bid on open tasks, once per task.
export async function place({ req, params }: Ctx) {
  const user = await requireUser(req, "provider")
  const body = parse(bidBody, await readJson(req))
  const task = await loadTask(parseId(params.id))
  if (task.status !== "open") throw new HttpError(409, "This task is no longer accepting bids.")

  const [bid] = await db
    .insert(bids)
    .values({ ...body, taskId: task.id, providerId: user.id })
    .returning({ id: bids.id })
  const [created] = await db
    .select(bidColumns)
    .from(bids)
    .innerJoin(users, eq(users.id, bids.providerId))
    .where(eq(bids.id, bid.id))
  return json(created, 201)
}

// POST /api/bids/:id/accept — the task owner picks one pending bid.
export async function accept({ req, params }: Ctx) {
  const user = await requireUser(req, "requester")
  const [bid] = await db.select().from(bids).where(eq(bids.id, parseId(params.id)))
  if (!bid) throw new HttpError(404, "Bid not found.")
  const task = await loadTask(bid.taskId)
  if (task.requesterId !== user.id) throw new HttpError(403, "Only the person who posted this task can accept bids.")
  if (task.status !== "open") throw new HttpError(409, "This task already has an accepted bid.")

  await db.transaction(async (tx) => {
    const [booked] = await tx
      .update(tasks)
      .set({ status: "booked" })
      .where(and(eq(tasks.id, task.id), eq(tasks.status, "open")))
      .returning({ id: tasks.id })
    if (!booked) throw new HttpError(409, "This task already has an accepted bid.")
    await tx
      .update(bids)
      .set({ status: sql`(case when ${bids.id} = ${bid.id} then 'accepted' else 'not-selected' end)::bid_status` })
      .where(eq(bids.taskId, task.id))
  })
  return json({ success: true, taskId: task.id, bidId: bid.id })
}

// GET /api/my/bids — a provider's bids with the task they belong to.
export async function mine({ req }: Ctx) {
  const user = await requireUser(req, "provider")
  const rows = await db
    .select({
      id: bids.id,
      taskId: bids.taskId,
      price: bids.price,
      hours: bids.hours,
      status: bids.status,
      createdAt: bids.createdAt,
      taskTitle: tasks.title,
      taskLocation: tasks.location,
      taskBudgetInr: tasks.budgetInr,
      taskStatus: tasks.status,
      requesterId: tasks.requesterId,
      requesterName: users.name,
      requesterInitials: users.initials,
      requesterTone: users.tone,
    })
    .from(bids)
    .innerJoin(tasks, eq(tasks.id, bids.taskId))
    .innerJoin(users, eq(users.id, tasks.requesterId))
    .where(eq(bids.providerId, user.id))
    .orderBy(desc(bids.createdAt))
  return json(rows)
}

// One chat thread per (task, provider): the requester can talk to anyone who
// bid on their task; a provider can only talk to the requester of a task they
// bid on. Clients poll with ?after=<last message id>.
import { and, asc, eq, gt, or } from "drizzle-orm"
import { db, schema } from "../../db/client.js"
import { requireUser, type SafeUser } from "../auth.js"
import { type Ctx, HttpError, json, readJson } from "../http.js"
import { messageBody, messageQuery, parse, parseId } from "../validate.js"
import { loadTask } from "./tasks.js"

const { bids, messages } = schema

async function openThread(user: SafeUser, taskId: number, providerId?: number) {
  const task = await loadTask(taskId)
  if (user.id === task.requesterId) {
    if (!providerId) throw new HttpError(400, "providerId is required.")
  } else if (user.role === "provider") {
    providerId = user.id
  } else {
    throw new HttpError(403, "You are not part of this conversation.")
  }
  const [bid] = await db
    .select({ id: bids.id })
    .from(bids)
    .where(and(eq(bids.taskId, task.id), eq(bids.providerId, providerId)))
  if (!bid) throw new HttpError(403, "Chat opens once the provider has bid on this task.")
  const otherId = user.id === providerId ? task.requesterId : providerId
  return { taskId: task.id, providerId, otherId }
}

function toMessage(userId: number) {
  return (m: typeof messages.$inferSelect) => ({
    id: m.id,
    taskId: m.taskId,
    senderId: m.senderId,
    recipientId: m.recipientId,
    text: m.text,
    createdAt: m.createdAt,
    mine: m.senderId === userId,
  })
}

// GET /api/tasks/:id/messages?providerId=&after=
export async function list({ req, url, params }: Ctx) {
  const user = await requireUser(req)
  const query = parse(messageQuery, Object.fromEntries(url.searchParams))
  const thread = await openThread(user, parseId(params.id), query.providerId)
  const rows = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.taskId, thread.taskId),
        or(eq(messages.senderId, thread.providerId), eq(messages.recipientId, thread.providerId)),
        gt(messages.id, query.after),
      ),
    )
    .orderBy(asc(messages.id))
    .limit(200)
  return json(rows.map(toMessage(user.id)))
}

// POST /api/tasks/:id/messages { text, providerId? }
export async function send({ req, params }: Ctx) {
  const user = await requireUser(req)
  const body = parse(messageBody, await readJson(req))
  const thread = await openThread(user, parseId(params.id), body.providerId)
  const [message] = await db
    .insert(messages)
    .values({ taskId: thread.taskId, senderId: user.id, recipientId: thread.otherId, text: body.text })
    .returning()
  return json(toMessage(user.id)(message), 201)
}

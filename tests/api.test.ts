// End-to-end API tests against the real Neon database (npm test).
// Creates throwaway users and deletes them (and their data) at the end.
import assert from "node:assert/strict"
import { after, before, test } from "node:test"
import { eq, inArray } from "drizzle-orm"
import { db, schema } from "../db/client.js"
import { handle } from "../server/handler.js"

const run = Date.now()
const createdUserIds: number[] = []

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await handle(
    new Request(`http://test${path}`, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  )
  return { status: res.status, body: await res.json() }
}

async function signUp(name: string, role: "requester" | "provider") {
  const email = `test-${run}-${name.toLowerCase()}@example.com`
  const res = await call("POST", "/api/auth/register", { name, email, password: "Password123", role })
  assert.equal(res.status, 201)
  createdUserIds.push(res.body.user.id)
  return { id: res.body.user.id as number, token: res.body.token as string }
}

let owner: { id: number; token: string }
let stranger: { id: number; token: string }
let pro1: { id: number; token: string }
let pro2: { id: number; token: string }
let taskId: number

before(async () => {
  owner = await signUp("Owner", "requester")
  stranger = await signUp("Stranger", "requester")
  pro1 = await signUp("ProOne", "provider")
  pro2 = await signUp("ProTwo", "provider")
})

after(async () => {
  await db.delete(schema.helplineTickets).where(eq(schema.helplineTickets.topic, `Test callback ${run}`))
  await db.delete(schema.users).where(inArray(schema.users.id, createdUserIds))
  await db.$client.end()
})

test("auth: login, me, bad password, duplicate email, tampered token", async () => {
  const email = `test-${run}-owner@example.com`
  const login = await call("POST", "/api/auth/login", { email: email.toUpperCase(), password: "Password123" })
  assert.equal(login.status, 200)
  assert.equal("passwordHash" in login.body.user, false)
  assert.equal((await call("GET", "/api/auth/me", undefined, owner.token)).body.user.id, owner.id)
  assert.equal((await call("POST", "/api/auth/login", { email, password: "wrong" })).status, 401)
  assert.equal((await call("POST", "/api/auth/register", { name: "X", email, password: "Password123", role: "requester" })).status, 409)
  assert.equal((await call("GET", "/api/auth/me", undefined, owner.token.slice(0, -2) + "xx")).status, 401)
})

test("tasks: only requesters post, input is validated", async () => {
  const task = { title: "Fix a fan", category: "Home repairs", location: "Indiranagar", budgetInr: 500, neededBy: "Today" }
  assert.equal((await call("POST", "/api/tasks", task)).status, 401)
  assert.equal((await call("POST", "/api/tasks", task, pro1.token)).status, 403)
  assert.equal((await call("POST", "/api/tasks", { ...task, budgetInr: 0 }, owner.token)).status, 400)
  const created = await call("POST", "/api/tasks", task, owner.token)
  assert.equal(created.status, 201)
  taskId = created.body.id
  const list = await call("GET", "/api/tasks")
  assert.ok(list.body.some((t: { id: number }) => t.id === taskId))
  assert.equal("bids" in (await call("GET", `/api/tasks/${taskId}`)).body, false)
})

test("bids: providers only, once per task, owner accepts once", async () => {
  assert.equal((await call("POST", `/api/tasks/${taskId}/bids`, { price: 400, hours: 2 }, owner.token)).status, 403)
  const bid1 = await call("POST", `/api/tasks/${taskId}/bids`, { price: 400, hours: 2 }, pro1.token)
  assert.equal(bid1.status, 201)
  assert.equal((await call("POST", `/api/tasks/${taskId}/bids`, { price: 300, hours: 2 }, pro1.token)).status, 409)
  const bid2 = await call("POST", `/api/tasks/${taskId}/bids`, { price: 450, hours: 1 }, pro2.token)
  assert.equal(bid2.status, 201)

  assert.equal((await call("GET", `/api/tasks/${taskId}`, undefined, owner.token)).body.bids.length, 2)
  assert.equal((await call("POST", `/api/bids/${bid1.body.id}/accept`, undefined, stranger.token)).status, 403)
  assert.equal((await call("POST", `/api/bids/${bid1.body.id}/accept`, undefined, pro1.token)).status, 403)
  assert.equal((await call("POST", `/api/bids/${bid1.body.id}/accept`, undefined, owner.token)).status, 200)
  assert.equal((await call("POST", `/api/bids/${bid2.body.id}/accept`, undefined, owner.token)).status, 409)
  assert.equal((await call("POST", `/api/tasks/${taskId}/bids`, { price: 300, hours: 1 }, pro2.token)).status, 409)

  const mine = await call("GET", "/api/my/bids", undefined, pro2.token)
  assert.equal(mine.body[0].status, "not-selected")
})

test("chat: only the requester and a bidding provider, polling with ?after", async () => {
  const sent = await call("POST", `/api/tasks/${taskId}/messages`, { text: "On my way" }, pro1.token)
  assert.equal(sent.status, 201)
  assert.equal(sent.body.recipientId, owner.id)
  const thread = await call("GET", `/api/tasks/${taskId}/messages?providerId=${pro1.id}`, undefined, owner.token)
  assert.deepEqual(thread.body.map((m: { text: string }) => m.text), ["On my way"])
  const newer = await call("GET", `/api/tasks/${taskId}/messages?providerId=${pro1.id}&after=${sent.body.id}`, undefined, owner.token)
  assert.equal(newer.body.length, 0)
  assert.equal((await call("GET", `/api/tasks/${taskId}/messages`, undefined, pro2.token)).body.length, 0)
  assert.equal((await call("GET", `/api/tasks/${taskId}/messages?providerId=${pro1.id}`, undefined, stranger.token)).status, 403)
  assert.equal((await call("GET", `/api/tasks/${taskId}/messages`)).status, 401)
})

test("complete: owner only, rating 1-5, only once, updates provider rating", async () => {
  assert.equal((await call("POST", `/api/tasks/${taskId}/complete`, { rating: 6 }, owner.token)).status, 400)
  assert.equal((await call("POST", `/api/tasks/${taskId}/complete`, { rating: 4 }, stranger.token)).status, 403)
  const done = await call("POST", `/api/tasks/${taskId}/complete`, { rating: 4, comment: "Good job" }, owner.token)
  assert.equal(done.status, 200)
  assert.equal(done.body.provider.reviews, 1)
  assert.equal(done.body.provider.rating, 4) // first review sets the rating
  assert.equal((await call("POST", `/api/tasks/${taskId}/complete`, { rating: 5 }, owner.token)).status, 409)

  const profile = await call("GET", `/api/providers/${pro1.id}`)
  assert.equal("email" in profile.body, false)
  assert.equal("phone" in profile.body, false)
  assert.equal(profile.body.customerReviews[0].comment, "Good job")
})

test("helpline and stats", async () => {
  const ticket = await call("POST", "/api/helpline", { topic: `Test callback ${run}`, phone: "+91 98765 00000" }, owner.token)
  assert.equal(ticket.status, 201)
  assert.equal((await call("POST", "/api/helpline", { topic: "x", phone: "abc" })).status, 400)
  const stats = await call("GET", "/api/stats", undefined, owner.token)
  assert.equal(stats.body.bookedCount, 1)
  assert.equal(stats.body.bidsReceived, 2)
})

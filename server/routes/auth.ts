import { eq, sql } from "drizzle-orm"
import { db, schema } from "../../db/client.js"
import { createToken, hashPassword, requireUser, toSafeUser, verifyPassword } from "../auth.js"
import { type Ctx, HttpError, json, readJson } from "../http.js"
import { loginBody, parse, registerBody } from "../validate.js"

const { users } = schema
const tones = ["mint", "yellow", "blue", "peach", "lavender"]

function initialsFor(name: string) {
  const parts = name.split(/\s+/)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)
  return letters.toUpperCase()
}

export async function register({ req }: Ctx) {
  const body = parse(registerBody, await readJson(req))
  const [user] = await db
    .insert(users)
    .values({
      email: body.email,
      name: body.name,
      phone: body.phone,
      role: body.role,
      initials: initialsFor(body.name),
      tone: tones[Math.floor(Math.random() * tones.length)],
      ...(await hashPassword(body.password)),
    })
    .returning()
  return json({ user: toSafeUser(user), token: createToken(user) }, 201)
}

export async function login({ req }: Ctx) {
  const body = parse(loginBody, await readJson(req))
  const [user] = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, body.email))
  if (!user || !(await verifyPassword(body.password, user))) {
    throw new HttpError(401, "Invalid email or password.")
  }
  return json({ user: toSafeUser(user), token: createToken(user) })
}

export async function me({ req }: Ctx) {
  return json({ user: await requireUser(req) })
}

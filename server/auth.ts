// Password hashing (PBKDF2, same parameters as the original backend so seeded
// hashes stay valid) and HS256 JWTs signed with JWT_SECRET.
import { createHmac, pbkdf2, randomBytes, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { eq } from "drizzle-orm"
import { db, schema } from "../db/client.js"
import { HttpError } from "./http.js"

const pbkdf2Async = promisify(pbkdf2)
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

type UserRow = typeof schema.users.$inferSelect
export type SafeUser = Omit<UserRow, "passwordHash" | "salt">
export type Role = UserRow["role"]

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to at least 32 characters")
  }
  return secret
}

export async function hashPassword(
  password: string,
  salt = randomBytes(16).toString("hex"),
) {
  const hash = await pbkdf2Async(password, salt, 100000, 64, "sha512")
  return { salt, passwordHash: hash.toString("hex") }
}

export async function verifyPassword(password: string, user: UserRow) {
  const { passwordHash } = await hashPassword(password, user.salt)
  return safeEqual(Buffer.from(passwordHash, "hex"), Buffer.from(user.passwordHash, "hex"))
}

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b)
}

function sign(data: string) {
  return createHmac("sha256", jwtSecret()).update(data).digest("base64url")
}

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")

export function createToken(user: { id: number; role: Role }) {
  const header = encode({ alg: "HS256", typ: "JWT" })
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  const payload = encode({ sub: user.id, role: user.role, exp })
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`
}

export function verifyToken(token: string): { sub: number } | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  if (!safeEqual(Buffer.from(signature), Buffer.from(sign(`${header}.${payload}`)))) {
    return null
  }
  try {
    const { alg } = JSON.parse(Buffer.from(header, "base64url").toString())
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString())
    if (alg !== "HS256" || !Number.isInteger(claims.sub)) return null
    if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) return null
    return { sub: claims.sub }
  } catch {
    return null
  }
}

export function toSafeUser({ passwordHash: _hash, salt: _salt, ...user }: UserRow): SafeUser {
  return user
}

export async function currentUser(req: Request): Promise<SafeUser | null> {
  const header = req.headers.get("authorization") ?? ""
  if (!header.startsWith("Bearer ")) return null
  const claims = verifyToken(header.slice(7).trim())
  if (!claims) return null
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, claims.sub))
  return user ? toSafeUser(user) : null
}

export async function requireUser(req: Request, role?: Role): Promise<SafeUser> {
  const user = await currentUser(req)
  if (!user) throw new HttpError(401, "Please log in to continue.")
  if (role && user.role !== role) {
    throw new HttpError(403, `Only ${role}s can do this.`)
  }
  return user
}

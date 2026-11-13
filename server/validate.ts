// Request validation. Every route parses its input through one of these.
import { z } from "zod"
import { HttpError } from "./http.js"

export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const issue = result.error.issues[0]
  const field = issue?.path.join(".")
  throw new HttpError(400, field ? `${field}: ${issue.message}` : (issue?.message ?? "Invalid input."))
}

export function parseId(value: string | null | undefined): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0 || id > 2_147_483_647) {
    throw new HttpError(404, "Not found.")
  }
  return id
}

const requiredText = (max: number) => z.string().trim().min(1, "is required").max(max)
const optionalText = (max: number) => z.string().trim().max(max).optional().default("")
const email = z.string().trim().toLowerCase().pipe(z.email("must be a valid email").max(254))
const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s-]{6,20}$/, "must be a valid phone number")
const httpsUrl = z
  .url({ protocol: /^https$/, error: "must be an https URL" })
  .max(500)

export const registerBody = z.object({
  name: requiredText(80),
  email,
  password: z.string().min(8, "must be at least 8 characters").max(128),
  phone: phone.optional().or(z.literal("")).default(""),
  role: z.enum(["requester", "provider"]),
})

export const loginBody = z.object({
  email,
  password: z.string().min(1, "is required").max(128),
})

export const createTaskBody = z.object({
  title: requiredText(120),
  category: requiredText(40),
  customCategory: optionalText(40),
  location: requiredText(80),
  budgetInr: z.coerce.number().int().min(50, "must be at least ₹50").max(1_000_000),
  neededBy: requiredText(60),
  details: optionalText(2000),
  imageUrl: httpsUrl.optional(),
})

export const taskListQuery = z.object({
  category: z.string().trim().max(40).optional(),
  search: z.string().trim().max(100).optional(),
  maxDistance: z.coerce.number().positive().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const bidBody = z.object({
  price: z.coerce.number().int().min(1).max(1_000_000),
  hours: z.coerce.number().int().min(1).max(240),
})

export const completeBody = z.object({
  rating: z.number().int().min(1, "must be between 1 and 5").max(5, "must be between 1 and 5"),
  comment: optionalText(1000),
  imageUrl: httpsUrl.optional(),
})

export const messageBody = z.object({
  text: requiredText(1000),
  providerId: z.coerce.number().int().positive().optional(),
})

export const messageQuery = z.object({
  providerId: z.coerce.number().int().positive().optional(),
  after: z.coerce.number().int().min(0).default(0),
})

export const helplineBody = z.object({
  topic: requiredText(200),
  phone,
  name: optionalText(80),
})

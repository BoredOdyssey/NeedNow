// Small Web-standard (Request/Response) helpers shared by every API route.

export type Ctx = { req: Request; url: URL; params: Record<string, string> }

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

// Photos go straight to Vercel Blob, so request bodies are small JSON only.
const MAX_BODY_BYTES = 64 * 1024

export async function readJson(req: Request): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? 0)
  if (declared > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.")
  }
  const text = await req.text()
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.")
  }
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.")
  }
}

// Postgres constraint names from db/schema.ts mapped to user-facing errors.
const constraintErrors: Record<string, [number, string]> = {
  users_email_lower_idx: [409, "An account with this email already exists."],
  bids_task_provider_idx: [409, "You have already placed a bid on this task."],
  bids_one_accepted_per_task_idx: [409, "This task already has an accepted bid."],
  reviews_task_id_unique: [409, "This task has already been completed and reviewed."],
}

type PgError = { code?: string; constraint?: string }

function findPgError(err: unknown): PgError | null {
  let current: unknown = err
  for (let depth = 0; current && depth < 3; depth++) {
    const candidate = current as PgError & { cause?: unknown }
    if (typeof candidate.code === "string" && /^[0-9A-Z]{5}$/.test(candidate.code)) {
      return candidate
    }
    current = candidate.cause
  }
  return null
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) return json({ error: err.message }, err.status)

  const pg = findPgError(err)
  if (pg) {
    const mapped = pg.constraint ? constraintErrors[pg.constraint] : undefined
    if (mapped) return json({ error: mapped[1] }, mapped[0])
    if (pg.code === "23505") return json({ error: "That already exists." }, 409)
    if (pg.code === "23503" || pg.code === "23514") {
      return json({ error: "Some of the submitted values are not allowed." }, 400)
    }
  }

  console.error("Unhandled API error:", err)
  return json({ error: "Something went wrong on our side. Please try again." }, 500)
}

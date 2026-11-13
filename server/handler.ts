// Single entry point for every /api/* request (Vercel function and local dev).
// No CORS headers: the app and API share one origin, so browsers block others.
import { type Ctx, errorResponse, json } from "./http.js"
import * as auth from "./routes/auth.js"
import * as bids from "./routes/bids.js"
import * as chat from "./routes/chat.js"
import * as misc from "./routes/misc.js"
import * as tasks from "./routes/tasks.js"
import { upload } from "./routes/upload.js"

type Handler = (ctx: Ctx) => Promise<Response> | Response

const routes: Array<[method: string, path: string, handler: Handler]> = [
  ["GET", "/api/health", misc.health],
  ["GET", "/api/categories", misc.categories],
  ["GET", "/api/stats", misc.stats],
  ["GET", "/api/providers/:id", misc.provider],
  ["POST", "/api/helpline", misc.helpline],
  ["POST", "/api/upload", upload],
  ["POST", "/api/auth/register", auth.register],
  ["POST", "/api/auth/login", auth.login],
  ["GET", "/api/auth/me", auth.me],
  ["GET", "/api/tasks", tasks.list],
  ["POST", "/api/tasks", tasks.create],
  ["GET", "/api/tasks/:id", tasks.get],
  ["POST", "/api/tasks/:id/complete", tasks.complete],
  ["GET", "/api/my/tasks", tasks.mine],
  ["POST", "/api/tasks/:id/bids", bids.place],
  ["POST", "/api/bids/:id/accept", bids.accept],
  ["GET", "/api/my/bids", bids.mine],
  ["GET", "/api/tasks/:id/messages", chat.list],
  ["POST", "/api/tasks/:id/messages", chat.send],
]

const compiled = routes.map(([method, path, handler]) => {
  const keys: string[] = []
  const pattern = new RegExp(
    "^" + path.replace(/:(\w+)/g, (_, key) => (keys.push(key), "([^/]+)")) + "/?$",
  )
  return { method, pattern, keys, handler }
})

// vercel.json rewrites /api/<path> to /api?path=<path>; local dev keeps the real path.
function apiPath(url: URL) {
  const rewritten = url.searchParams.get("path")
  if (rewritten !== null && url.pathname.replace(/\/$/, "") === "/api") {
    url.searchParams.delete("path")
    return `/api/${rewritten.replace(/^\/+/, "")}`
  }
  return url.pathname
}

export async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = apiPath(url)
  try {
    let pathMatched = false
    for (const route of compiled) {
      const match = route.pattern.exec(path)
      if (!match) continue
      pathMatched = true
      if (route.method !== req.method) continue
      const params = Object.fromEntries(route.keys.map((key, i) => [key, match[i + 1]]))
      return await route.handler({ req, url, params })
    }
    return pathMatched
      ? json({ error: "Method not allowed." }, 405)
      : json({ error: "Not found." }, 404)
  } catch (err) {
    return errorResponse(err)
  }
}

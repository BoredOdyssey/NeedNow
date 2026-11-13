// The only Vercel function. vercel.json rewrites every /api/* path here,
// which keeps the Hobby plan's function count at one.
import { handle } from "../server/handler.js"

export const GET = handle
export const POST = handle

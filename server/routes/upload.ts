// POST /api/upload — Vercel Blob client uploads. The browser asks for a
// short-lived token here, then sends the photo straight to Blob storage, so
// photos never pass through (or bloat) our function or database.
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client"
import { requireUser } from "../auth.js"
import { type Ctx, HttpError, json, readJson } from "../http.js"

export async function upload({ req }: Ctx) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new HttpError(503, "Photo uploads are not configured yet.")
  }
  const body = (await readJson(req)) as HandleUploadBody
  // Token requests come from our users; completion callbacks come from Vercel
  // and are verified by handleUpload itself.
  if (body.type === "blob.generate-client-token") await requireUser(req)

  const result = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
      maximumSizeInBytes: 5 * 1024 * 1024,
      addRandomSuffix: true,
    }),
  })
  return json(result)
}

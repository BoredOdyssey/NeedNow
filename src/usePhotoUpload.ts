import { useState } from "react"
import { api } from "./api"

// Uploads a picked photo to Vercel Blob and keeps its public URL.
export function usePhotoUpload() {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  const pick = async (file?: File) => {
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Choose a JPG, PNG or WEBP image.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.")
      return
    }
    setError("")
    setUploading(true)
    try {
      setUrl(await api.uploadPhoto(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const clear = () => {
    setUrl("")
    setError("")
  }

  return { url, error, uploading, pick, clear }
}

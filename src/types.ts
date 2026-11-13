export type View = "home" | "requester" | "provider"
export type TaskDraft = {
  title?: string
  category?: string
  location?: string
  budget?: string
  date?: string
}
// A bid as the UI shows it. API bids (src/api.ts) fit this shape; the
// landing page's sample bids leave the ids and status out.
export type Bid = {
  id: number
  taskId?: number
  providerId?: number
  name: string
  initials: string
  tone: string
  rating: number
  reviews: number
  distance: number | null
  hours: number
  price: number
  status?: "pending" | "accepted" | "not-selected"
  portfolio?: string[]
}
// Who the chat panel talks to: one thread per task and provider.
export type ChatTarget = {
  taskId: number
  providerId?: number
  name: string
  initials: string
  tone: string
  subtitle: string
}
export type ShowToast = (message: string, kind?: "success" | "error") => void

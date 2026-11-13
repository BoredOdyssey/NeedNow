// API client for the NeedNow backend (/api/*, same origin).
// No live event stream any more: screens that need fresh data poll.

export type Role = "requester" | "provider"

export interface User {
  id: number
  email: string
  name: string
  phone: string
  role: Role
  initials: string
  tone: string
  rating: number
  reviewsCount: number
  jobsCompleted: number
  distanceKm: number | null
  hours: number | null
  price: number | null
  bio: string
  services: string[]
  portfolio: string[]
}

export interface Bid {
  id: number
  taskId: number
  providerId: number
  price: number
  hours: number
  status: "pending" | "accepted" | "not-selected"
  createdAt: string
  name: string
  initials: string
  tone: string
  rating: number
  reviews: number
  distance: number | null
  portfolio: string[]
}

export interface MyBid {
  id: number
  taskId: number
  price: number
  hours: number
  status: Bid["status"]
}

export interface Task {
  id: number
  title: string
  category: string
  customCategory: string
  location: string
  distanceKm: number | null
  budgetInr: number
  neededBy: string
  details: string
  imageUrl: string | null
  status: "open" | "booked" | "completed" | "cancelled"
  createdAt: string
  requesterId: number
  requesterName: string
  bidsCount: number
  bids?: Bid[]
  myBid?: MyBid | null
}

export interface ProviderBid extends MyBid {
  createdAt: string
  taskTitle: string
  taskLocation: string
  taskBudgetInr: number
  taskStatus: Task["status"]
  requesterId: number
  requesterName: string
  requesterInitials: string
  requesterTone: string
}

export interface Message {
  id: number
  taskId: number
  senderId: number
  recipientId: number | null
  text: string
  createdAt: string
  mine: boolean
}

export interface Review {
  id: number
  rating: number
  comment: string
  imageUrl: string | null
  createdAt: string
  requesterName: string
}

export interface ProviderProfile {
  id: number
  name: string
  initials: string
  tone: string
  rating: number
  reviews: number
  jobsCompleted: number
  distance: number | null
  hours: number | null
  price: number | null
  bio: string
  services: string[]
  portfolio: string[]
  customerReviews: Review[]
}

export interface Stats {
  openRequests?: number
  bidsReceived?: number
  bookedCount?: number
  nearbyRequests?: number
  activeBids?: number
  wonJobs?: number
  rating?: number
  reviews?: number
}

export interface NewTask {
  title: string
  category: string
  customCategory?: string
  location: string
  budgetInr: number
  neededBy: string
  details?: string
  imageUrl?: string
}

const TOKEN_KEY = "neednow_auth_token"

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

class ApiClient {
  private token: string | null = readToken()

  private setToken(token: string | null) {
    this.token = token
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {}
  }

  private authHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {}
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...this.authHeaders(), ...init.headers },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`)
    }
    return data as T
  }

  private post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) })
  }

  // Auth
  async register(params: { name: string; email: string; password: string; phone?: string; role: Role }) {
    const data = await this.post<{ user: User; token: string }>("/api/auth/register", params)
    this.setToken(data.token)
    return data
  }

  async login(email: string, password: string) {
    const data = await this.post<{ user: User; token: string }>("/api/auth/login", { email, password })
    this.setToken(data.token)
    return data
  }

  async getMe(): Promise<User | null> {
    if (!this.token) return null
    try {
      return (await this.request<{ user: User }>("/api/auth/me")).user
    } catch {
      this.setToken(null)
      return null
    }
  }

  logout() {
    this.setToken(null)
  }

  // Marketplace
  getStats() {
    return this.request<Stats>("/api/stats")
  }

  getTasks(filters: { category?: string; search?: string; maxDistance?: number } = {}) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") query.set(key, String(value))
    }
    const qs = query.toString()
    return this.request<Task[]>(`/api/tasks${qs ? `?${qs}` : ""}`)
  }

  getTask(id: number) {
    return this.request<Task>(`/api/tasks/${id}`)
  }

  getMyTasks() {
    return this.request<Task[]>("/api/my/tasks")
  }

  createTask(task: NewTask) {
    return this.post<Task>("/api/tasks", task)
  }

  completeTask(taskId: number, review: { rating: number; comment?: string; imageUrl?: string }) {
    return this.post<{ success: true; provider: { id: number; rating: number; reviews: number } }>(
      `/api/tasks/${taskId}/complete`,
      review,
    )
  }

  // Bids
  placeBid(taskId: number, price: number, hours: number) {
    return this.post<Bid>(`/api/tasks/${taskId}/bids`, { price, hours })
  }

  acceptBid(bidId: number) {
    return this.post<{ success: true; taskId: number; bidId: number }>(`/api/bids/${bidId}/accept`)
  }

  getMyBids() {
    return this.request<ProviderBid[]>("/api/my/bids")
  }

  getProvider(id: number) {
    return this.request<ProviderProfile>(`/api/providers/${id}`)
  }

  // Chat (poll getMessages with `after` set to the last id you have)
  getMessages(taskId: number, options: { providerId?: number; after?: number } = {}) {
    const query = new URLSearchParams()
    if (options.providerId) query.set("providerId", String(options.providerId))
    if (options.after) query.set("after", String(options.after))
    return this.request<Message[]>(`/api/tasks/${taskId}/messages?${query}`)
  }

  sendMessage(taskId: number, text: string, providerId?: number) {
    return this.post<Message>(`/api/tasks/${taskId}/messages`, { text, providerId })
  }

  // Helpline
  submitHelpline(topic: string, phone: string, name?: string) {
    return this.post<{ success: true; message: string }>("/api/helpline", { topic, phone, name })
  }

  // Photos go straight to Vercel Blob; returns the public URL to store.
  async uploadPhoto(file: File) {
    const { upload } = await import("@vercel/blob/client")
    const blob = await upload(`photos/${file.name}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      headers: this.authHeaders(),
    })
    return blob.url
  }
}

export const api = new ApiClient()

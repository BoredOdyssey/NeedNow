import { type FormEvent, useCallback, useEffect, useState } from "react"
import { api, type Stats, type Task, type User } from "../api"
import { DashboardHeader } from "../components/layout"
import { FeedbackModal, ProviderProfileModal } from "../components/modals"
import { BidRow, Button, Icon, StatusChip } from "../components/ui"
import { categories, photoFor } from "../data"
import { type Bid, type ChatTarget, type ShowToast, type TaskDraft, type View } from "../types"
import { usePhotoUpload } from "../usePhotoUpload"

const POLL_MS = 15000

const statusLabel: Record<Task["status"], [label: string, chip: string]> = {
  open: ["Open", "open"],
  booked: ["Booked", "accepted"],
  completed: ["Completed", "accepted"],
  cancelled: ["Cancelled", "muted"],
}

function formatDate(value: string) {
  return new Date(`${value}T00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export function RequesterDashboard({
  setView,
  showToast,
  openChat,
  initialDraft,
  currentUser,
}: {
  setView: (v: View) => void
  showToast: ShowToast
  openChat: (target: ChatTarget) => void
  initialDraft: TaskDraft
  currentUser?: User | null
}) {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [stats, setStats] = useState<Stats>({})
  const [sort, setSort] = useState("price")
  const [title, setTitle] = useState(initialDraft.title ?? "")
  const [category, setCategory] = useState(initialDraft.category ?? "")
  const [customCategory, setCustomCategory] = useState("")
  const [location, setLocation] = useState(initialDraft.location ?? "Indiranagar")
  const [budget, setBudget] = useState(initialDraft.budget?.replace(/\D/g, "") ?? "")
  const [date, setDate] = useState(initialDraft.date ?? "")
  const [details, setDetails] = useState("")
  const [posting, setPosting] = useState(false)
  const photo = usePhotoUpload()
  const [feedback, setFeedback] = useState<{ task: Task; bid: Bid } | null>(null)
  const [profileBid, setProfileBid] = useState<Bid | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [myTasks, myStats] = await Promise.all([api.getMyTasks(), api.getStats()])
      setTasks(myTasks)
      setStats(myStats)
    } catch (err) {
      showToast((err as Error).message, "error")
    }
  }, [showToast])

  // Poll so new bids show up without a reload.
  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  const sortBids = (bids: Bid[]) =>
    [...bids].sort((a, b) =>
      sort === "rating" ? b.rating - a.rating : sort === "fastest" ? a.hours - b.hours : a.price - b.price,
    )

  const accept = async (bid: Bid) => {
    try {
      await api.acceptBid(bid.id)
      showToast(`${bid.name} is booked. You can chat to confirm the details.`)
      await refresh()
    } catch (err) {
      showToast((err as Error).message, "error")
    }
  }

  const submitTask = async (e: FormEvent) => {
    e.preventDefault()
    if (photo.uploading) return
    setPosting(true)
    try {
      const task = await api.createTask({
        title,
        category,
        customCategory,
        location,
        budgetInr: Number(budget),
        neededBy: formatDate(date),
        details,
        imageUrl: photo.url || undefined,
      })
      showToast(`Task posted: “${task.title}”`)
      setTitle("")
      setCategory("")
      setCustomCategory("")
      setBudget("")
      setDate("")
      setDetails("")
      photo.clear()
      await refresh()
    } catch (err) {
      showToast((err as Error).message, "error")
    } finally {
      setPosting(false)
    }
  }

  const chatWith = (task: Task) => (bid: Bid) =>
    openChat({
      taskId: task.id,
      providerId: bid.providerId,
      name: bid.name,
      initials: bid.initials,
      tone: bid.tone,
      subtitle: `${task.title} · Bid ₹${bid.price}`,
    })

  return (
    <main className="dashboard container">
      <DashboardHeader setView={setView} currentUser={currentUser} />
      <div className="stats">
        <article>
          <span>Open requests</span>
          <strong>{stats.openRequests ?? "–"}</strong>
          <small>Active now</small>
        </article>
        <article>
          <span>Bids received</span>
          <strong>{stats.bidsReceived ?? "–"}</strong>
          <small>Across your requests</small>
        </article>
        <article>
          <span>Booked</span>
          <strong>{stats.bookedCount ?? "–"}</strong>
          <small>Booked or completed</small>
        </article>
      </div>
      <section className="quick-start">
        <div>
          <span className="eyebrow">Post another task</span>
          <h2>Choose a service</h2>
        </div>
        <div className="quick-service-list">
          {categories.slice(0, 6).map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setCategory(item.name)
                document
                  .getElementById("task-form")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }}
            >
              <span className={`tone-${item.tone}`}>
                <Icon name={item.icon} size={19} />
              </span>
              {item.name}
            </button>
          ))}
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel post-panel" id="task-form">
          <div className="panel-title">
            <span className="panel-icon">
              <Icon name="event" />
            </span>
            <div>
              <h2>Post a task</h2>
              <p>Add enough detail for providers to give you a fair bid.</p>
            </div>
          </div>
          <form className="post-form" onSubmit={submitTask}>
            <label className="field field-wide">
              <span>Task title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fix ceiling fan"
                maxLength={120}
                required
              />
            </label>
            <label className="field">
              <span>Category</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  if (e.target.value !== "Something else") setCustomCategory("")
                }}
                required
              >
                <option value="" disabled>
                  Choose category
                </option>
                {categories.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
            {category === "Something else" && (
              <label className="field">
                <span>What kind of help?</span>
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Pet care, garden help"
                  maxLength={40}
                  required
                />
              </label>
            )}
            <label className="field">
              <span>Budget (₹)</span>
              <input
                type="number"
                min={50}
                step={1}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500"
                required
              />
            </label>
            <label className="field">
              <span>Location</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Your neighbourhood"
                maxLength={80}
                required
              />
            </label>
            <label className="field">
              <span>Needed by</span>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="field field-wide">
              <span>Details</span>
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                placeholder="Add helpful details about the job, access and timing."
              />
            </label>
            <div className="field field-wide">
              <span>Task photo (optional)</span>
              {photo.url ? (
                <div className="task-image-preview">
                  <img src={photo.url} alt="Preview of the task attachment" />
                  <div>
                    <strong>Photo attached</strong>
                    <span>This will help providers understand the job.</span>
                  </div>
                  <button type="button" onClick={photo.clear} aria-label="Remove attached photo">
                    <Icon name="close" size={17} /> Remove
                  </button>
                </div>
              ) : (
                <label className="image-upload">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={photo.uploading}
                    onChange={(e) => photo.pick(e.target.files?.[0])}
                  />
                  <span className="upload-icon">
                    <Icon name="camera" />
                  </span>
                  <span>
                    <strong>{photo.uploading ? "Uploading…" : "Add a photo"}</strong>
                    <small>Show the item, space or problem clearly</small>
                  </span>
                  <b>JPG, PNG or WEBP · Max 5 MB</b>
                </label>
              )}
              {photo.error && (
                <p className="image-error" role="alert">
                  {photo.error}
                </p>
              )}
            </div>
            <Button type="submit" disabled={posting || photo.uploading}>
              {posting ? "Posting…" : "Post task"} <Icon name="arrow" size={18} />
            </Button>
          </form>
        </section>
        <section className="panel requests-panel">
          <div className="requests-head">
            <div>
              <h2>Your requests</h2>
              <p>See your tasks and compare each offer</p>
            </div>
            <label>
              Sort bids
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="price">Lowest price</option>
                <option value="rating">Best rated</option>
                <option value="fastest">Fastest</option>
              </select>
            </label>
          </div>
          {tasks === null && <p>Loading your requests…</p>}
          {tasks?.length === 0 && <p>No requests yet. Post your first task to start getting bids.</p>}
          {tasks?.map((task) => {
            const bids = task.bids ?? []
            const acceptedBid = bids.find((b) => b.status === "accepted")
            const [label, chip] = statusLabel[task.status]
            return (
              <article className="request-card" key={task.id}>
                <div className="request-top">
                  <div className="request-summary">
                    <img
                      src={task.imageUrl || photoFor(task.category)}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <StatusChip type={chip}>{label}</StatusChip>
                      <h3>{task.title}</h3>
                      <p>
                        {task.customCategory || task.category} · Budget ₹{task.budgetInr} ·{" "}
                        {task.location} · {task.neededBy}
                      </p>
                    </div>
                  </div>
                  {bids.length ? (
                    <strong>
                      {bids.length} {bids.length === 1 ? "bid" : "bids"}
                    </strong>
                  ) : (
                    <span className="waiting">
                      <span /> Waiting for bids
                    </span>
                  )}
                </div>
                {bids.length > 0 && (
                  <div className="bid-list">
                    {sortBids(bids).map((b) => (
                      <BidRow
                        key={b.id}
                        bid={b}
                        actions
                        onChat={chatWith(task)}
                        onAccept={task.status === "open" ? accept : undefined}
                        onViewProfile={setProfileBid}
                      />
                    ))}
                  </div>
                )}
                {acceptedBid && task.status !== "open" && (
                  <div className={`completion-prompt ${task.status === "completed" ? "is-done" : ""}`}>
                    <span>
                      <Icon name={task.status === "completed" ? "check" : "shield"} />
                    </span>
                    <div>
                      <strong>
                        {task.status === "completed" ? "Task complete and reviewed" : "Is the job finished?"}
                      </strong>
                      <p>
                        {task.status === "completed"
                          ? `Your review now appears on ${acceptedBid.name}’s profile.`
                          : "Mark it done once the work is finished, then leave a review."}
                      </p>
                    </div>
                    {task.status === "booked" && (
                      <Button onClick={() => setFeedback({ task, bid: acceptedBid })}>
                        Mark done & review
                      </Button>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      </div>
      {feedback && (
        <FeedbackModal
          provider={feedback.bid}
          onClose={() => setFeedback(null)}
          onSubmit={async (rating, comment, imageUrl) => {
            await api.completeTask(feedback.task.id, { rating, comment, imageUrl })
            setFeedback(null)
            showToast(`Thanks! Your ${rating}-star review was added to ${feedback.bid.name}.`)
            await refresh()
          }}
        />
      )}
      {profileBid && (
        <ProviderProfileModal
          provider={{ ...profileBid, id: profileBid.providerId ?? profileBid.id }}
          onClose={() => setProfileBid(null)}
        />
      )}
    </main>
  )
}

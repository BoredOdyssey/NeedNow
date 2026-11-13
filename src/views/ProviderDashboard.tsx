import { type FormEvent, useCallback, useEffect, useState } from "react"
import { api, type ProviderBid, type Stats, type Task, type User } from "../api"
import { DashboardHeader } from "../components/layout"
import { ProviderProfileModal } from "../components/modals"
import { Button, Icon, StatusChip } from "../components/ui"
import { photoFor, servicePhotos } from "../data"
import { type ChatTarget, type ShowToast, type View } from "../types"

const POLL_MS = 15000
const filters = ["All jobs", "Under 2 km", "Home repairs"]

const bidStatus: Record<ProviderBid["status"], [label: string, chip: string]> = {
  pending: ["Pending", "pending"],
  accepted: ["Accepted", "accepted"],
  "not-selected": ["Not selected", "muted"],
}

export function ProviderDashboard({
  setView,
  showToast,
  openChat,
  currentUser,
}: {
  setView: (v: View) => void
  showToast: ShowToast
  openChat: (target: ChatTarget) => void
  currentUser?: User | null
}) {
  const [filter, setFilter] = useState("All jobs")
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [myBids, setMyBids] = useState<ProviderBid[]>([])
  const [stats, setStats] = useState<Stats>({})
  const [bidding, setBidding] = useState<number | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [openTasks, bids, myStats] = await Promise.all([
        api.getTasks({
          category: filter === "Home repairs" ? "Home repairs" : undefined,
          maxDistance: filter === "Under 2 km" ? 2 : undefined,
        }),
        api.getMyBids(),
        api.getStats(),
      ])
      setTasks(openTasks)
      setMyBids(bids)
      setStats(myStats)
    } catch (err) {
      showToast((err as Error).message, "error")
    }
  }, [filter, showToast])

  // Poll so new tasks and bid decisions show up without a reload.
  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  const placeBid = async (task: Task, e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBidding(task.id)
    try {
      await api.placeBid(task.id, Number(form.get("price")), Number(form.get("hours")))
      showToast(`Bid placed on “${task.title}”. Good luck!`)
      await refresh()
    } catch (err) {
      showToast((err as Error).message, "error")
    } finally {
      setBidding(null)
    }
  }

  const chatAbout = (bid: ProviderBid) =>
    openChat({
      taskId: bid.taskId,
      name: bid.requesterName,
      initials: bid.requesterInitials,
      tone: bid.requesterTone,
      subtitle: `${bid.taskTitle} · Your bid ₹${bid.price}`,
    })

  return (
    <main className="dashboard container">
      <DashboardHeader provider setView={setView} currentUser={currentUser} />
      <div className="stats provider-stats">
        <article>
          <span>Open requests</span>
          <strong>{stats.nearbyRequests ?? "–"}</strong>
          <small>Accepting bids now</small>
        </article>
        <article>
          <span>Active bids</span>
          <strong>{stats.activeBids ?? "–"}</strong>
          <small>Waiting for a reply</small>
        </article>
        <article>
          <span>Jobs won</span>
          <strong>{stats.wonJobs ?? "–"}</strong>
          <small>
            ★ {stats.rating ?? "–"} · {stats.reviews ?? 0} reviews
          </small>
        </article>
      </div>
      {currentUser && (
        <section className="provider-profile-strip">
          <div className="profile-photo-stack">
            <img
              src={currentUser.portfolio[0] ?? servicePhotos.repair}
              alt=""
              referrerPolicy="no-referrer"
            />
            <span>
              <Icon name="check" size={15} />
            </span>
          </div>
          <div>
            <strong>Your profile is live</strong>
            <p>
              {stats.rating ?? currentUser.rating} rating · {stats.reviews ?? currentUser.reviewsCount} reviews ·
              Available for new work
            </p>
          </div>
          <Button variant="outline" onClick={() => setProfileOpen(true)}>
            View profile
          </Button>
        </section>
      )}
      <section className="provider-layout">
        <div>
          <div className="section-heading compact">
            <span className="eyebrow">Open nearby</span>
            <h2>Jobs you can bid on</h2>
            <p>Requests from people in your area that are still accepting bids.</p>
          </div>
          <div className="job-filters" aria-label="Filter nearby jobs">
            {filters.map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="task-card-list">
            {tasks === null && <p>Loading jobs…</p>}
            {tasks?.length === 0 && <p>No open jobs match this filter right now.</p>}
            {tasks?.map((task) => (
              <article className="nearby-card" key={task.id}>
                <div className="nearby-main">
                  <div className="task-thumb">
                    <img
                      src={task.imageUrl || photoFor(task.category)}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span>{task.customCategory || task.category}</span>
                    <h3>{task.title}</h3>
                    <p>
                      <Icon name="pin" size={15} />{" "}
                      {task.distanceKm != null && `${task.distanceKm} km · `}
                      {task.requesterName} · {task.location}
                    </p>
                  </div>
                  <div className="task-meta">
                    <strong>₹{task.budgetInr}</strong>
                    <span>{task.neededBy}</span>
                  </div>
                </div>
                {task.myBid ? (
                  <div className="bid-placed">
                    <Icon name="check" />
                    <div>
                      <strong>Bid placed · ₹{task.myBid.price}</strong>
                      <span>The requester can now see your offer.</span>
                    </div>
                  </div>
                ) : (
                  <form className="inline-bid" onSubmit={(e) => placeBid(task, e)}>
                    <label>
                      <span>Your price (₹)</span>
                      <input name="price" type="number" min="1" placeholder="500" required />
                    </label>
                    <label>
                      <span>Hours needed</span>
                      <input name="hours" type="number" min="1" max="240" placeholder="2" required />
                    </label>
                    <Button type="submit" disabled={bidding === task.id}>
                      {bidding === task.id ? "Placing…" : "Place bid"}
                    </Button>
                  </form>
                )}
              </article>
            ))}
          </div>
        </div>
        <aside className="panel your-bids">
          <div className="panel-title">
            <span className="panel-icon">
              <Icon name="tag" />
            </span>
            <div>
              <h2>Your bids</h2>
              <p>Track your recent offers.</p>
            </div>
          </div>
          {myBids.length === 0 && <p>You haven’t placed any bids yet.</p>}
          {myBids.map((bid) => {
            const [label, chip] = bidStatus[bid.status]
            return (
              <div className="your-bid" key={bid.id}>
                <div>
                  <h3>{bid.taskTitle}</h3>
                  <span>
                    ₹{bid.price} · {bid.hours} {bid.hours === 1 ? "hour" : "hours"}
                  </span>
                </div>
                <div className="your-bid-actions">
                  <StatusChip type={chip}>{label}</StatusChip>
                  {bid.status !== "not-selected" && (
                    <Button variant="soft" onClick={() => chatAbout(bid)}>
                      Chat
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </aside>
      </section>
      {profileOpen && currentUser && (
        <ProviderProfileModal provider={currentUser} onClose={() => setProfileOpen(false)} />
      )}
    </main>
  )
}

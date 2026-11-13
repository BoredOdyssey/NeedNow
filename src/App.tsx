import { type FormEvent, useCallback, useEffect, useRef, useState } from "react"
import { api, type User } from "./api"
import { ChatPanel } from "./components/ChatPanel"
import { Footer, Nav } from "./components/layout"
import { AuthModal } from "./components/modals"
import { Button, Icon } from "./components/ui"
import { type ChatTarget, type ShowToast, type TaskDraft, type View } from "./types"
import { Landing } from "./views/Landing"
import { ProviderDashboard } from "./views/ProviderDashboard"
import { RequesterDashboard } from "./views/RequesterDashboard"

const VIEW_KEY = "neednow_current_view"

function saveView(view: View) {
  try {
    if (view === "home") localStorage.removeItem(VIEW_KEY)
    else localStorage.setItem(VIEW_KEY, view)
  } catch {}
}

export default function App() {
  const [view, setView] = useState<View>("home")
  const [authOpen, setAuthOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pendingTask, setPendingTask] = useState(false)
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [chat, setChat] = useState<ChatTarget | null>(null)
  const [taskDraft, setTaskDraft] = useState<TaskDraft>({})
  const [helplineOpen, setHelplineOpen] = useState(false)
  const [helplineSending, setHelplineSending] = useState(false)

  // Restore the last dashboard only after the session is confirmed, and only
  // the one that matches the user's role.
  useEffect(() => {
    api.getMe().then((user) => {
      if (!user) return
      setCurrentUser(user)
      let saved: string | null = null
      try {
        saved = localStorage.getItem(VIEW_KEY)
      } catch {}
      if (saved === user.role) setView(user.role)
    })
  }, [])

  const showToast: ShowToast = useCallback((message, kind = "success") => {
    clearTimeout(toastTimer.current)
    setToast({ message, kind })
    toastTimer.current = setTimeout(() => setToast(null), 4200)
  }, [])

  const goTo = (next: View) => {
    setView(next)
    saveView(next)
    setChat(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const changeView = (next: View) => {
    if (next !== "home" && !currentUser) {
      setPendingTask(next === "requester")
      setAuthOpen(true)
      return
    }
    if (next !== "home" && currentUser && currentUser.role !== next) {
      showToast(
        next === "provider"
          ? "Log in with a provider account to bid on jobs."
          : "Log in with a requester account to post tasks.",
        "error",
      )
      return
    }
    goTo(next)
  }

  const startTask = (draft: TaskDraft) => {
    setTaskDraft(draft)
    changeView("requester")
  }

  const submitHelpline = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setHelplineSending(true)
    try {
      const res = await api.submitHelpline(String(form.get("topic")), String(form.get("phone")))
      setHelplineOpen(false)
      showToast(res.message)
    } catch (err) {
      showToast((err as Error).message, "error")
    } finally {
      setHelplineSending(false)
    }
  }

  return (
    <div id="top">
      <Nav
        view={view}
        setView={changeView}
        openAuth={() => {
          setPendingTask(false)
          setAuthOpen(true)
        }}
        startTask={startTask}
        isLoggedIn={!!currentUser}
        currentUser={currentUser}
        onLogout={() => {
          api.logout()
          setCurrentUser(null)
          setTaskDraft({})
          goTo("home")
        }}
      />
      {view === "home" && <Landing setView={changeView} startTask={startTask} />}
      {view === "requester" && (
        <RequesterDashboard
          setView={changeView}
          showToast={showToast}
          openChat={setChat}
          initialDraft={taskDraft}
          currentUser={currentUser}
        />
      )}
      {view === "provider" && (
        <ProviderDashboard
          setView={changeView}
          showToast={showToast}
          openChat={setChat}
          currentUser={currentUser}
        />
      )}
      {view === "home" && <Footer />}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onLogin={(user) => {
            setCurrentUser(user)
            setAuthOpen(false)
            setPendingTask(false)
            goTo(pendingTask && user.role === "requester" ? "requester" : user.role)
            showToast(`Welcome, ${user.name}! You’re logged in.`)
          }}
        />
      )}
      {chat && <ChatPanel chat={chat} onClose={() => setChat(null)} />}
      <button
        className="helpline-button"
        onClick={() => setHelplineOpen((open) => !open)}
        aria-expanded={helplineOpen}
        aria-label="Open helpline"
      >
        <span>
          <Icon name="phone" size={19} />
        </span>
        <span>
          <small>Need help?</small>
          Helpline
        </span>
      </button>
      {helplineOpen && (
        <section className="helpline-popover" aria-label="Helpline">
          <button
            className="helpline-close"
            onClick={() => setHelplineOpen(false)}
            aria-label="Close helpline"
          >
            <Icon name="close" size={17} />
          </button>
          <h3>How can we help?</h3>
          <p>Leave your number and we’ll call you back about tasks, bids or bookings.</p>
          <form className="helpline-form" onSubmit={submitHelpline}>
            <input
              name="phone"
              type="tel"
              placeholder="Your phone number"
              defaultValue={currentUser?.phone}
              pattern="\+?[\d\s\-]{6,20}"
              aria-label="Phone number"
              required
            />
            <input
              name="topic"
              placeholder="What do you need help with?"
              maxLength={200}
              aria-label="Topic"
              required
            />
            <Button variant="dark" type="submit" disabled={helplineSending}>
              <Icon name="phone" size={16} /> {helplineSending ? "Sending…" : "Request a callback"}
            </Button>
          </form>
        </section>
      )}
      {toast && (
        <div className={`toast ${toast.kind === "error" ? "toast-error" : ""}`} role="status">
          <span>
            <Icon name={toast.kind === "error" ? "close" : "check"} />
          </span>
          {toast.message}
        </div>
      )}
    </div>
  )
}

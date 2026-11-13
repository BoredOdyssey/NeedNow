import { useState } from "react"
import { type User } from "../api"
import { Button, Icon } from "./ui"
import { categories } from "../data"
import { type TaskDraft, type View } from "../types"

export function Nav({
  view,
  setView,
  openAuth,
  startTask,
  isLoggedIn,
  currentUser,
  onLogout,
}: {
  view: View
  setView: (v: View) => void
  openAuth: () => void
  startTask: (draft: TaskDraft) => void
  isLoggedIn: boolean
  currentUser?: User | null
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const goHome = () => {
    setView("home")
    setOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  return (
    <header className="nav-wrap">
      <nav className="nav container" aria-label="Main navigation">
        <button className="logo" onClick={goHome} aria-label="NeedNow home">
          Need<span>Now</span>
          <i>.</i>
        </button>
        <div className={`nav-links ${open ? "is-open" : ""}`}>
          {view === "home" ? (
            <>
              <a href="#how" onClick={() => setOpen(false)}>
                How it works
              </a>
              <a href="#categories" onClick={() => setOpen(false)}>
                Categories
              </a>
              <a href="#providers" onClick={() => setOpen(false)}>
                For providers
              </a>
              <a href="#about" onClick={() => setOpen(false)}>
                About
              </a>
            </>
          ) : (
            <>
              <button
                className={view === "requester" ? "active" : ""}
                onClick={() => {
                  setView("requester")
                  setOpen(false)
                }}
              >
                I need work done
              </button>
              <button
                className={view === "provider" ? "active" : ""}
                onClick={() => {
                  setView("provider")
                  setOpen(false)
                }}
              >
                I do the work
              </button>
            </>
          )}
        </div>
        <div className="nav-actions">
          {isLoggedIn && currentUser && (
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span className={`avatar avatar-${currentUser.tone || "mint"} avatar-sm`}>
                {currentUser.initials || currentUser.name.slice(0, 2).toUpperCase()}
              </span>
              {currentUser.name.split(" ")[0]}
            </span>
          )}
          {view === "home" ? (
            <>
              {isLoggedIn ? (
                <>
                  <Button variant="outline" onClick={() => setView("requester")}>
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onLogout()
                      goHome()
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={openAuth}>
                  Log in
                </Button>
              )}
              <Button onClick={() => startTask({})}>Post a task</Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                onLogout()
                goHome()
              }}
            >
              Log out
            </Button>
          )}
          <button
            className="menu-button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </nav>
    </header>
  )
}

export function DashboardHeader({
  provider = false,
  setView,
  currentUser,
}: {
  provider?: boolean
  setView: (v: View) => void
  currentUser?: User | null
}) {
  const firstName = currentUser?.name
    ? currentUser.name.trim().split(" ")[0]
    : provider
      ? "Partner"
      : "there"
  return (
    <div className="dash-header">
      <div>
        <span className="eyebrow">
          {provider ? "Provider dashboard" : "Requester dashboard"}
        </span>
        <h1>Hi, {firstName}.</h1>
        <p>
          {provider
            ? "Here are the latest jobs near you."
            : "Here’s the latest on your tasks."}
        </p>
        <span className="dashboard-location">
          <Icon name="pin" size={15} /> Indiranagar, Bengaluru
        </span>
      </div>
      <div className="role-switch">
        <button
          className={!provider ? "active" : ""}
          onClick={() => setView("requester")}
        >
          I need work done
        </button>
        <button
          className={provider ? "active" : ""}
          onClick={() => setView("provider")}
        >
          I do the work
        </button>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer>
      <div className="container">
        <div>
          <div className="logo">
            Need<span>Now</span>
            <i>.</i>
          </div>
          <p>Hyperlocal reverse bidding for everyday services.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#how">How it works</a>
          <a href="#categories">Categories</a>
          <a href="#providers">Providers</a>
          <a href="#top">Back to top</a>
        </nav>
      </div>
    </footer>
  )
}

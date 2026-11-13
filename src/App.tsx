import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"
import { api, User } from "./api"

type View = "home" | "requester" | "provider"
type TaskDraft = {
  title?: string
  category?: string
  location?: string
  budget?: string
  date?: string
}
type Bid = {
  id: number
  name: string
  initials: string
  tone: string
  rating: number
  reviews: number
  distance: number
  hours: number
  price: number
  role?: string
  reviewImage?: string
  reviewComment?: string
  portfolio?: string[]
  status?: "accepted" | "not-selected"
}

const iconPaths: Record<string, ReactNode> = {
  wrench: (
    <>
      <path d="M14.7 6.3a4 4 0 0 1-5 5L4 17l-2 1 1-2 5.7-5.7a4 4 0 0 1 5-5L12 8l2 2 2.7-3.7Z" />
    </>
  ),
  book: (
    <>
      <path d="M3 5.5c3-1 5-.5 7 1.5v11c-2-2-4-2.5-7-1.5v-11Zm14 0c-3-1-5-.5-7 1.5v11c2-2 4-2.5 7-1.5v-11Z" />
    </>
  ),
  camera: (
    <>
      <path d="M3 7h3l1.5-2h5L14 7h3v9H3V7Z" />
      <circle cx="10" cy="11.5" r="3" />
    </>
  ),
  truck: (
    <>
      <path d="M2 6h10v8H2V6Zm10 3h3l3 3v2h-6V9Z" />
      <circle cx="5" cy="15.5" r="1.5" />
      <circle cx="15" cy="15.5" r="1.5" />
    </>
  ),
  bike: (
    <>
      <circle cx="5" cy="14" r="3" />
      <circle cx="15" cy="14" r="3" />
      <path d="m5 14 4-7 3 7H5Zm4-7h4m-5 3 5-1 2 5" />
    </>
  ),
  event: (
    <>
      <path d="M3 10h14M5 7h10v10H5V7Zm2-3v5m6-5v5" />
      <path d="m8 13 1.5 1.5L13 11" />
    </>
  ),
  pin: (
    <>
      <path d="M10 18s5-5.3 5-10a5 5 0 0 0-10 0c0 4.7 5 10 5 10Z" />
      <circle cx="10" cy="8" r="1.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </>
  ),
  shield: (
    <>
      <path d="M10 2 16 5v5c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V5l6-3Z" />
      <path d="m7 10 2 2 4-4" />
    </>
  ),
  tag: (
    <>
      <path d="m3 10 7-7h6v6l-7 7-6-6Z" />
      <circle cx="13" cy="6" r="1" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="6" />
      <path d="m14 14 4 4" />
    </>
  ),
  chat: (
    <>
      <path d="M3 4h14v10H8l-4 3v-3H3V4Z" />
    </>
  ),
  phone: (
    <>
      <path d="M6 3 3.5 5.5c.8 5.2 5.8 10.2 11 11L17 14l-3-2-1.7 1.7a11.5 11.5 0 0 1-6-6L8 6 6 3Z" />
    </>
  ),
  send: (
    <>
      <path d="m2 3 16 7-16 7 3-7-3-7Zm3 7h13" />
    </>
  ),
  check: (
    <>
      <path d="m4 10 4 4 8-8" />
    </>
  ),
  arrow: (
    <>
      <path d="M3 10h14m-5-5 5 5-5 5" />
    </>
  ),
  menu: (
    <>
      <path d="M3 5h14M3 10h14M3 15h14" />
    </>
  ),
  close: (
    <>
      <path d="m4 4 12 12M16 4 4 16" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "soft" | "dark"
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}

function Avatar({
  initials,
  tone = "mint",
  size = "md",
}: {
  initials: string
  tone?: string
  size?: "sm" | "md" | "lg"
}) {
  return (
    <span
      className={`avatar avatar-${tone} avatar-${size}`}
      role="img"
      aria-label={`${initials} profile illustration`}
    >
      <span className="avatar-hair" />
      <span className="avatar-face">
        <i className="avatar-eye avatar-eye-left" />
        <i className="avatar-eye avatar-eye-right" />
        <i className="avatar-smile" />
      </span>
    </span>
  )
}

function StatusChip({
  children,
  type = "open",
}: {
  children: ReactNode
  type?: string
}) {
  return <span className={`status status-${type}`}>{children}</span>
}

const categories = [
  { name: "Home repairs", icon: "wrench", tone: "mint" },
  { name: "Tutoring", icon: "book", tone: "yellow" },
  { name: "Photography", icon: "camera", tone: "pink" },
  { name: "Moving", icon: "truck", tone: "lavender" },
  { name: "Deliveries", icon: "bike", tone: "blue" },
  { name: "Event support", icon: "event", tone: "peach" },
  { name: "Something else", icon: "search", tone: "cream" },
]

const servicePhotos = {
  repair:
    "https://images.unsplash.com/photo-1597497522150-2f50bffea452?auto=format&fit=crop&w=900&q=82",
  tutor:
    "https://images.unsplash.com/photo-1566827886072-417be1953f36?auto=format&fit=crop&w=900&q=82",
  photography:
    "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=900&q=82",
  moving:
    "https://images.unsplash.com/photo-1596199736721-16d3677365a4?auto=format&fit=crop&w=900&q=82",
  cleaning:
    "https://images.unsplash.com/photo-1793016049699-2c071f7867db?auto=format&fit=crop&w=900&q=82",
  provider:
    "https://images.unsplash.com/photo-1682662046457-74fd5b199b92?auto=format&fit=crop&w=1200&q=85",
  delivery:
    "https://images.unsplash.com/photo-1614018453562-77f6180ce036?auto=format&fit=crop&w=900&q=82",
  authRepair:
    "https://images.unsplash.com/photo-1713192704825-74a0017f585d?auto=format&fit=crop&w=900&q=85",
  authMoving:
    "https://images.unsplash.com/photo-1672559987333-976876fa8a12?auto=format&fit=crop&w=700&q=85",
  authCamera:
    "https://images.unsplash.com/photo-1596629917694-39954024f734?auto=format&fit=crop&w=700&q=85",
}

const initialBids: Bid[] = [
  {
    id: 1,
    name: "Meera Plumbing Works",
    initials: "MP",
    tone: "yellow",
    rating: 4.9,
    reviews: 128,
    distance: 1.2,
    hours: 2,
    price: 380,
    portfolio: [
      servicePhotos.repair,
      servicePhotos.authRepair,
      servicePhotos.cleaning,
    ],
  },
  {
    id: 2,
    name: "Ravi Kumar",
    initials: "RK",
    tone: "mint",
    rating: 4.8,
    reviews: 91,
    distance: 0.8,
    hours: 1,
    price: 450,
    portfolio: [
      servicePhotos.authRepair,
      servicePhotos.moving,
      servicePhotos.provider,
    ],
  },
  {
    id: 3,
    name: "Sanjay Verma",
    initials: "SV",
    tone: "blue",
    rating: 4.7,
    reviews: 63,
    distance: 2.1,
    hours: 3,
    price: 500,
    portfolio: [
      servicePhotos.repair,
      servicePhotos.authMoving,
      servicePhotos.authCamera,
    ],
  },
]

function Nav({
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

function TaskWidget({ onPost }: { onPost: (draft: TaskDraft) => void }) {
  const [task, setTask] = useState("")
  const [location, setLocation] = useState("Indiranagar")
  const [budget, setBudget] = useState("₹ 500")
  const [date, setDate] = useState("")
  return (
    <form
      className="task-widget"
      onSubmit={(e) => {
        e.preventDefault()
        onPost({ title: task, location, budget, date })
      }}
    >
      <label className="field field-wide">
        <span>What do you need help with?</span>
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="e.g. Fix my ceiling fan"
          required
        />
      </label>
      <label className="field">
        <span>Location</span>
        <input
          placeholder="Indiranagar"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Budget</span>
        <input
          placeholder="₹ 500"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Needed by</span>
        <input
          type="date"
          aria-label="Needed by date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <Button type="submit">
        Get bids <Icon name="arrow" size={18} />
      </Button>
    </form>
  )
}

function BidRow({
  bid,
  actions = false,
  onChat,
  onAccept,
  onViewProfile,
}: {
  bid: Bid
  actions?: boolean
  onChat?: (bid: Bid) => void
  onAccept?: (bid: Bid) => void
  onViewProfile?: (bid: Bid) => void
}) {
  return (
    <div className={`bid-row ${bid.status ? `bid-${bid.status}` : ""}`}>
      <Avatar initials={bid.initials} tone={bid.tone} size="sm" />
      <div className="bid-person">
        {onViewProfile ? (
          <button className="bid-name" onClick={() => onViewProfile(bid)}>
            {bid.name}
          </button>
        ) : (
          <strong>{bid.name}</strong>
        )}
        <span>
          <b>★ {bid.rating}</b> ({bid.reviews}) · {bid.distance} km
        </span>
      </div>
      <div className="bid-time">
        <Icon name="clock" size={15} />
        <span>
          {bid.hours} {bid.hours === 1 ? "hour" : "hours"}
        </span>
      </div>
      <div className="bid-price">
        <strong>₹{bid.price}</strong>
        <span>total price</span>
      </div>
      {actions && bid.status !== "not-selected" && (
        <div className="bid-actions">
          <Button variant="outline" onClick={() => onViewProfile?.(bid)}>
            Past work
          </Button>
          <Button variant="soft" onClick={() => onChat?.(bid)}>
            Chat
          </Button>
          {!bid.status && (
            <Button onClick={() => onAccept?.(bid)}>Accept bid</Button>
          )}
        </div>
      )}
      {bid.status && (
        <StatusChip type={bid.status === "accepted" ? "accepted" : "muted"}>
          {bid.status === "accepted" ? "Accepted" : "Not selected"}
        </StatusChip>
      )}
    </div>
  )
}

function BidCard({ bids = initialBids }: { bids?: Bid[] }) {
  return (
    <article className="comparison-card">
      <div className="comparison-head">
        <StatusChip>Sample request</StatusChip>
        <span>3 bids</span>
      </div>
      <h3>Fix a leaking kitchen tap</h3>
      <p>Budget ₹500 · Needed by tomorrow, 6 pm · Within 3 km</p>
      <div className="bid-list">
        {bids.slice(0, 3).map((b) => (
          <BidRow key={b.id} bid={b} />
        ))}
      </div>
      <small>Sample request. Prices and profiles are for illustration.</small>
    </article>
  )
}

function PeopleIllustration() {
  return (
    <div
      className="people-art"
      aria-label="Local professionals helping with home repairs, tutoring and cleaning"
    >
      <div className="hero-mosaic">
        <div className="hero-tile hero-tile-main">
          <img
            src={servicePhotos.repair}
            alt="Kitchen tap that needs a repair"
            referrerPolicy="no-referrer"
          />
          <span>Home repairs</span>
        </div>
        <div className="hero-tile hero-tile-top">
          <img
            src={servicePhotos.tutor}
            alt="Study books and a pencil on a table"
            referrerPolicy="no-referrer"
          />
          <span>Tutoring</span>
        </div>
        <div className="hero-tile hero-tile-bottom">
          <img
            src={servicePhotos.cleaning}
            alt="Fresh laundry drying at an Indian home"
            referrerPolicy="no-referrer"
          />
          <span>Home care</span>
        </div>
      </div>
      <div className="hero-photo-label">
        <span className="live-dot" />
        Help available in Indiranagar
      </div>
      <div className="float-bid float-one">
        <Avatar initials="RS" tone="peach" size="sm" />
        <strong>₹490</strong>
        <span>· 3 hrs</span>
      </div>
      <div className="float-bid float-two">
        <Icon name="check" size={14} />
        <strong>3 bids received</strong>
      </div>
    </div>
  )
}

function Landing({
  setView,
  startTask,
}: {
  setView: (v: View) => void
  startTask: (draft: TaskDraft) => void
}) {
  const steps = [
    [
      "01",
      "Post your task",
      "Describe the job, add your budget and say when you need it.",
    ],
    [
      "02",
      "Hear from locals",
      "Nearby providers send a price and a time that works.",
    ],
    ["03", "Compare offers", "See price, ratings, reviews and estimated time."],
    [
      "04",
      "Chat and hire",
      "Talk it through, then choose the person who feels right.",
    ],
  ]
  const popular = [
    ["Home repairs", "Fix a leaking tap", "₹400–₹700", servicePhotos.repair],
    [
      "Tutoring",
      "Maths tutor, 3 evenings",
      "₹1,200–₹2,500",
      servicePhotos.tutor,
    ],
    [
      "Photography",
      "Birthday party photos",
      "₹2,000–₹5,000",
      servicePhotos.photography,
    ],
    ["Moving", "Move a sofa and fridge", "₹800–₹2,000", servicePhotos.moving],
    [
      "Home repairs",
      "A thorough home clean",
      "₹600–₹1,400",
      servicePhotos.cleaning,
    ],
    ["Deliveries", "Pick up a parcel", "₹150–₹400", servicePhotos.delivery],
  ]
  const faqs = [
    [
      "How does reverse bidding work?",
      "You post what you need with your budget and deadline. Nearby providers send bids, and you choose the one you prefer.",
    ],
    [
      "How do I compare providers?",
      "Each bid shows price, rating, estimated completion time and past reviews, so you can compare them side by side.",
    ],
    [
      "What kind of tasks can I post?",
      "Short-term, location-based jobs such as home repairs, tutoring, photography, moving, deliveries and event support.",
    ],
    [
      "Can providers find work here?",
      "Yes. Freelancers, technicians, skilled workers and small businesses can browse nearby requests and bid with their own price.",
    ],
  ]
  return (
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">Local help, without the searching</span>
          <h1>
            Tell us the job. <em>See the bids.</em>
            <br />
            Choose what works.
          </h1>
          <p>
            Share what you need. People nearby can send their price and when
            they’re free. You pick the offer that suits you.
          </p>
          <TaskWidget onPost={startTask} />
          <div className="trust-row">
            <span>
              <Icon name="check" size={15} /> Compare ratings
            </span>
            <span>
              <Icon name="check" size={15} /> Clear prices
            </span>
            <span>
              <Icon name="check" size={15} /> Stay local
            </span>
          </div>
        </div>
        <PeopleIllustration />
      </section>

      <section className="section container" id="categories">
        <div className="section-heading">
          <span className="eyebrow">Common tasks</span>
          <h2>What do you need help with?</h2>
          <p>
            Choose a starting point. If your job is different, just tell us
            about it.
          </p>
        </div>
        <div className="category-grid">
          {categories.map((c) => (
            <button
              className={`category-card tone-${c.tone}`}
              key={c.name}
              onClick={() => startTask({ category: c.name })}
            >
              <span>
                <Icon name={c.icon} size={25} />
              </span>
              <strong>{c.name}</strong>
              <Icon name="arrow" size={17} />
            </button>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <span className="eyebrow">Nearby requests</span>
          <h2>Jobs people often post</h2>
          <p>
            These are examples, not fixed prices. You know what the job is worth
            to you.
          </p>
        </div>
        <div className="popular-grid">
          {popular.map(([cat, title, budget, photo]) => (
            <button
              className="popular-card"
              key={title}
              onClick={() =>
                startTask({
                  title,
                  category: cat,
                  budget,
                  location: "Indiranagar",
                })
              }
            >
              <div className="portrait">
                <img
                  src={photo}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span>{cat}</span>
                <h3>{title}</h3>
                <p>Example budget {budget}</p>
                <span className="post-similar">
                  Post something similar <Icon name="arrow" size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="section container" id="how">
        <div className="section-heading">
          <span className="eyebrow">How it works</span>
          <h2>Four simple steps</h2>
        </div>
        <div className="steps">
          {steps.map(([num, title, text]) => (
            <article className="step" key={num}>
              <span>{num}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="offers-band">
        <div className="container offers-grid">
          <div>
            <span className="eyebrow">Clear choices</span>
            <h2>
              See every offer.
              <br />
              Pick the right one.
            </h2>
            <p>
              Post the job once, compare offers in one place and talk to anyone
              you’re considering.
            </p>
            <ul className="check-list">
              <li>
                <Icon name="check" />
                Set your own budget and deadline
              </li>
              <li>
                <Icon name="check" />
                Compare several bids at a glance
              </li>
              <li>
                <Icon name="check" />
                See what their previous customers say
              </li>
              <li>
                <Icon name="check" />
                Have a proper chat before you decide
              </li>
            </ul>
          </div>
          <BidCard />
        </div>
      </section>

      <section className="section container" id="providers">
        <div className="provider-banner">
          <div className="provider-photo">
            <img
              src={servicePhotos.provider}
              alt="Indian living room ready for a home service visit"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="eyebrow">For local providers</span>
            <h2>Find work that fits your day.</h2>
            <p>
              Pick the jobs that suit you, name a fair price, and let good
              reviews do the talking.
            </p>
          </div>
          <Button variant="dark" onClick={() => setView("provider")}>
            Start bidding <Icon name="arrow" size={18} />
          </Button>
        </div>
      </section>

      <section className="section container" id="about">
        <div className="section-heading">
          <span className="eyebrow">Why NeedNow</span>
          <h2>A simpler way to find local help</h2>
        </div>
        <div className="feature-grid">
          {[
            [
              "clock",
              "Faster hiring",
              "Post once and check the offers when you’re ready.",
            ],
            [
              "tag",
              "Clear pricing",
              "See the whole price up front, without the awkward back-and-forth.",
            ],
            [
              "shield",
              "Trusted community",
              "Read honest feedback from people who have hired them before.",
            ],
            [
              "pin",
              "Truly local",
              "Find someone nearby who knows the area and can get there easily.",
            ],
          ].map(([icon, title, text]) => (
            <article className="feature" key={title}>
              <span>
                <Icon name={icon} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section container faq-section">
        <div className="section-heading">
          <span className="eyebrow">Questions</span>
          <h2>A few useful answers</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta container">
        <div>
          <h2>Ready to post a task?</h2>
          <p>Share the details and see who’s available nearby.</p>
        </div>
        <div>
          <Button onClick={() => startTask({})}>Post a task</Button>
          <Button variant="outline" onClick={() => setView("provider")}>
            Become a provider
          </Button>
        </div>
      </section>
    </main>
  )
}

function AuthModal({
  onClose,
  onLogin,
}: {
  onClose: () => void
  onLogin: (user: User, role: View) => void
}) {
  const [tab, setTab] = useState<"login" | "signup">("login")
  const [role, setRole] = useState<View>("requester")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [onClose])
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = String(data.get("email")).trim()
    const password = String(data.get("password"))
    const name = String(data.get("name") || "").trim()
    const phone = String(data.get("phone") || "").trim()
    const confirm = String(data.get("confirmPassword"))
    setNotice("")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.")
      return
    }
    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setError("Use at least 8 characters with a letter and a number.")
      return
    }
    if (tab === "signup" && name.length < 2) {
      setError("Tell us your full name.")
      return
    }
    if (tab === "signup" && !/^\+?[\d\s-]{10,15}$/.test(phone)) {
      setError("Enter a valid phone number.")
      return
    }
    if (tab === "signup" && password !== confirm) {
      setError("Your passwords do not match.")
      return
    }
    if (tab === "signup" && !data.get("terms")) {
      setError("Please agree to the terms to create your account.")
      return
    }
    setError("")
    setLoading(true)
    try {
      if (tab === "signup") {
        const res = await api.register({
          name,
          email,
          password,
          phone,
          role: role === "provider" ? "provider" : "requester",
        })
        onLogin(res.user, role)
      } else {
        const res = await api.login(email, password)
        onLogin(res.user, (res.user.role as View) || "requester")
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <div className="auth-photo">
          <div className="auth-task-grid">
            <img
              className="auth-task-main"
              src={servicePhotos.authRepair}
              alt="Indian living room with a ceiling fan to repair"
              referrerPolicy="no-referrer"
            />
            <img
              src={servicePhotos.authMoving}
              alt="Kitchen sink that needs household repair"
              referrerPolicy="no-referrer"
            />
            <img
              src={servicePhotos.authCamera}
              alt="Household furniture ready to move"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="auth-purpose">
            <span className="auth-photo-badge">
              <Icon name="pin" size={16} /> Local help for real tasks
            </span>
            <h3>Post the job, compare offers and choose.</h3>
            <ul>
              <li>
                <Icon name="check" size={14} /> Tell nearby providers what you
                need
              </li>
              <li>
                <Icon name="check" size={14} /> Compare price, time and reviews
              </li>
              <li>
                <Icon name="check" size={14} /> Chat before you choose
              </li>
            </ul>
          </div>
        </div>
        <div className="auth-content">
          <div className="modal-mark">N.</div>
          <h2 id="auth-title">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p>
            {tab === "login"
              ? "Log in to see your tasks, bids and messages."
              : "Create an account to post tasks or find local work."}
          </p>
          <div className="auth-tabs">
            <button
              type="button"
              className={tab === "login" ? "active" : ""}
              onClick={() => {
                setTab("login")
                setError("")
                setNotice("")
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={tab === "signup" ? "active" : ""}
              onClick={() => {
                setTab("signup")
                setError("")
                setNotice("")
              }}
            >
              Sign up
            </button>
          </div>
          <form onSubmit={submit} className="auth-form" noValidate>
            {tab === "signup" && (
              <div className="auth-row">
                <label className="field">
                  <span>Full name</span>
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Ananya Sharma"
                    required
                  />
                </label>
                <label className="field">
                  <span>Phone number</span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    required
                  />
                </label>
              </div>
            )}
            <label className="field">
              <span>Email address</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </label>
            <div className={tab === "signup" ? "auth-row" : ""}>
              <label className="field">
                <span>Password</span>
                <div className="password-field">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      tab === "login" ? "current-password" : "new-password"
                    }
                    placeholder="8+ characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              {tab === "signup" && (
                <label className="field">
                  <span>Confirm password</span>
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    required
                  />
                </label>
              )}
            </div>
            {tab === "signup" && (
              <fieldset>
                <legend>How will you use NeedNow?</legend>
                <div className="role-choice">
                  <label className={role === "requester" ? "selected" : ""}>
                    <input
                      type="radio"
                      name="role"
                      checked={role === "requester"}
                      onChange={() => setRole("requester")}
                    />
                    <Icon name="search" />I need work done
                  </label>
                  <label className={role === "provider" ? "selected" : ""}>
                    <input
                      type="radio"
                      name="role"
                      checked={role === "provider"}
                      onChange={() => setRole("provider")}
                    />
                    <Icon name="wrench" />I do the work
                  </label>
                </div>
              </fieldset>
            )}
            {tab === "login" ? (
              <div className="auth-options">
                <label>
                  <input type="checkbox" name="remember" /> Keep me logged in
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError("")
                    setNotice(
                      "Enter your email above and we’ll send reset instructions.",
                    )
                  }}
                >
                  Forgot password?
                </button>
              </div>
            ) : (
              <label className="terms-check">
                <input type="checkbox" name="terms" /> I agree to the Terms of
                Service and Privacy Policy.
              </label>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="form-notice" role="status">
                {notice}
              </p>
            )}
            <Button type="submit">
              {tab === "login" ? "Log in securely" : "Create my account"}{" "}
              <Icon name="arrow" size={18} />
            </Button>
          </form>
          <small>This is a demo. We don’t save or send your details.</small>
        </div>
      </section>
    </div>
  )
}

function FeedbackModal({
  provider,
  onClose,
  onSubmit,
}: {
  provider: Bid
  onClose: () => void
  onSubmit: (rating: number, comment: string, image: string) => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [reviewImage, setReviewImage] = useState("")
  const [imageError, setImageError] = useState("")
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [onClose])
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <section
        className="feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <div className="feedback-provider">
          <Avatar initials={provider.initials} tone={provider.tone} size="md" />
          <div>
            <span>Task complete</span>
            <h2 id="feedback-title">How did it go with {provider.name}?</h2>
            <p>Share an honest review to help the next person decide.</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!rating) {
              setError("Choose a star rating before submitting.")
              return
            }
            if (!reviewImage) {
              setImageError(
                "Attach a finished-work photo before submitting your review.",
              )
              return
            }
            onSubmit(rating, comment, reviewImage)
          }}
        >
          <fieldset className="rating-field">
            <legend>Your rating</legend>
            <div className="star-rating" aria-label="Choose a rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={star <= rating ? "active" : ""}
                  onClick={() => {
                    setRating(star)
                    setError("")
                  }}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
            <span>
              {rating
                ? [
                    "",
                    "Needs improvement",
                    "Fair",
                    "Good",
                    "Very good",
                    "Excellent",
                  ][rating]
                : "Tap a star to rate"}
            </span>
          </fieldset>
          <label className="field">
            <span>Share a few words (optional)</span>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the work on time? Was communication clear?"
            />
          </label>
          <div className="field">
            <span>Finished-work photo (required)</span>
            {reviewImage ? (
              <div className="feedback-image-preview">
                <img src={reviewImage} alt="Review attachment preview" />
                <button
                  type="button"
                  onClick={() => {
                    setReviewImage("")
                    setImageError("")
                  }}
                >
                  <Icon name="close" size={16} /> Remove
                </button>
              </div>
            ) : (
              <label className="feedback-image-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (!file.type.startsWith("image/")) {
                      setImageError("Choose a JPG, PNG or WEBP image.")
                      return
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      setImageError("Choose an image smaller than 5 MB.")
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = () => {
                      setReviewImage(String(reader.result))
                      setImageError("")
                    }
                    reader.readAsDataURL(file)
                  }}
                />
                <Icon name="camera" size={18} />
                <span>
                  <strong>Attach a photo</strong>
                  <small>Required to confirm the completed task</small>
                </span>
              </label>
            )}
            {imageError && (
              <p className="image-error" role="alert">
                {imageError}
              </p>
            )}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit">
            Submit review <Icon name="arrow" size={17} />
          </Button>
        </form>
      </section>
    </div>
  )
}

function ProviderProfileModal({
  provider,
  onClose,
}: {
  provider: Bid
  onClose: () => void
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [onClose])
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <section
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <div className="profile-cover">
          <img
            src={provider.portfolio?.[0] ?? servicePhotos.repair}
            alt="Recent home repair work"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="profile-body">
          <div className="profile-identity">
            <Avatar
              initials={provider.initials}
              tone={provider.tone}
              size="lg"
            />
            <div>
              <div className="profile-name-row">
                <h2 id="profile-title">{provider.name}</h2>
                <span className="verified-label">
                  <Icon name="shield" size={14} /> Verified
                </span>
              </div>
              <p>Home repairs and general maintenance · Indiranagar</p>
            </div>
          </div>
          <div className="profile-metrics">
            <div>
              <strong>★ {provider.rating}</strong>
              <span>{provider.reviews} reviews</span>
            </div>
            <div>
              <strong>38</strong>
              <span>Jobs completed</span>
            </div>
            <div>
              <strong>1.1 km</strong>
              <span>From you</span>
            </div>
          </div>
          <div className="profile-section">
            <h3>Services</h3>
            <div className="profile-tags">
              <span>Home repairs</span>
              <span>Furniture assembly</span>
              <span>Minor electrical work</span>
              <span>Installations</span>
            </div>
          </div>
          <div className="profile-section">
            <h3>About</h3>
            <p>
              Local technician with six years of experience in everyday home
              repairs. Clear about pricing, brings the right tools and confirms
              timing before each visit.
            </p>
          </div>
          <div className="profile-section">
            <div className="portfolio-heading">
              <h3>Previous work</h3>
              <span>{provider.portfolio?.length ?? 3} completed jobs</span>
            </div>
            <div className="portfolio-grid">
              {(
                provider.portfolio ?? [
                  servicePhotos.repair,
                  servicePhotos.authRepair,
                  servicePhotos.moving,
                ]
              ).map((photo, index) => (
                <figure key={photo}>
                  <img
                    src={photo}
                    alt={`Previous work example ${index + 1}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <figcaption>
                    {["Home repair", "Installation", "Completed task"][index] ??
                      "Completed task"}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          {provider.reviewImage && (
            <div className="profile-review">
              <img
                src={provider.reviewImage}
                alt="Customer review attachment"
              />
              <div>
                <span>Latest review</span>
                <strong>★ {provider.rating}</strong>
                <p>
                  {provider.reviewComment ||
                    "Work completed and confirmed by the requester."}
                </p>
              </div>
            </div>
          )}
          <Button variant="outline" onClick={onClose}>
            Close profile
          </Button>
        </div>
      </section>
    </div>
  )
}

function DashboardHeader({
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

function RequesterDashboard({
  setView,
  showToast,
  openChat,
  initialDraft,
  onProviderReview,
  currentUser,
}: {
  setView: (v: View) => void
  showToast: (s: string) => void
  openChat: (b: Bid) => void
  initialDraft: TaskDraft
  onProviderReview: (provider: Bid) => void
  currentUser?: User | null
}) {
  const [bids, setBids] = useState(initialBids)
  const [sort, setSort] = useState("price")
  const [posted, setPosted] = useState(false)
  const [title, setTitle] = useState(initialDraft.title ?? "")
  const [category, setCategory] = useState(initialDraft.category ?? "")
  const [customCategory, setCustomCategory] = useState("")
  const [location, setLocation] = useState(
    initialDraft.location ?? "Indiranagar",
  )
  const [budget, setBudget] = useState(initialDraft.budget ?? "")
  const [date, setDate] = useState(initialDraft.date ?? "")
  const [taskImage, setTaskImage] = useState("")
  const [imageError, setImageError] = useState("")
  const [completed, setCompleted] = useState(false)
  const [feedbackBid, setFeedbackBid] = useState<Bid | null>(null)
  const [profileBid, setProfileBid] = useState<Bid | null>(null)
  const sorted = useMemo(
    () =>
      [...bids].sort((a, b) =>
        sort === "rating"
          ? b.rating - a.rating
          : sort === "fastest"
            ? a.hours - b.hours
            : a.price - b.price,
      ),
    [bids, sort],
  )
  const accept = async (selected: Bid) => {
    setCompleted(false)
    setBids((current) =>
      current.map((b) => ({
        ...b,
        status: b.id === selected.id ? "accepted" : "not-selected",
      })),
    )
    try {
      await api.acceptBid(selected.id)
    } catch {}
    showToast(
      `${selected.name} is booked. You can chat to confirm the details.`,
    )
  }
  const submitTask = async (e: FormEvent) => {
    e.preventDefault()
    setPosted(true)
    try {
      await api.createTask({
        title: title || "Fix ceiling fan",
        category: category || "Home repairs",
        customCategory,
        location,
        budget: budget || "₹ 500",
        neededBy: date || "As soon as possible",
        imageUrl: taskImage,
      })
      showToast(`Task posted & stored in database: “${title || "Fix ceiling fan"}”`)
    } catch {
      showToast(`Task posted: “${title || "Fix ceiling fan"}”`)
    }
  }
  const acceptedBid = bids.find((bid) => bid.status === "accepted")
  return (
    <main className="dashboard container">
      <DashboardHeader setView={setView} currentUser={currentUser} />
      <div className="stats">
        <article>
          <span>Open requests</span>
          <strong>{posted ? 3 : 2}</strong>
          <small>Active now</small>
        </article>
        <article>
          <span>Bids received</span>
          <strong>{posted ? 9 : 8}</strong>
          <small>Across your requests</small>
        </article>
        <article>
          <span>Booked</span>
          <strong>{bids.some((b) => b.status === "accepted") ? 2 : 1}</strong>
          <small>Ready to go</small>
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
                  required
                />
              </label>
            )}
            <label className="field">
              <span>Budget</span>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="₹ 500"
                required
              />
            </label>
            <label className="field">
              <span>Location</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Your neighbourhood"
                required
              />
            </label>
            <label className="field">
              <span>Needed by</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="field field-wide">
              <span>Details</span>
              <textarea
                rows={4}
                placeholder="Add helpful details about the job, access and timing."
              />
            </label>
            <div className="field field-wide">
              <span>Task photo (optional)</span>
              {taskImage ? (
                <div className="task-image-preview">
                  <img src={taskImage} alt="Preview of the task attachment" />
                  <div>
                    <strong>Photo attached</strong>
                    <span>This will help providers understand the job.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskImage("")
                      setImageError("")
                    }}
                    aria-label="Remove attached photo"
                  >
                    <Icon name="close" size={17} /> Remove
                  </button>
                </div>
              ) : (
                <label className="image-upload">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (!file.type.startsWith("image/")) {
                        setImageError("Choose a JPG, PNG or WEBP image.")
                        return
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        setImageError("Choose an image smaller than 5 MB.")
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = () => {
                        setTaskImage(String(reader.result))
                        setImageError("")
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                  <span className="upload-icon">
                    <Icon name="camera" />
                  </span>
                  <span>
                    <strong>Add a photo</strong>
                    <small>Show the item, space or problem clearly</small>
                  </span>
                  <b>JPG, PNG or WEBP · Max 5 MB</b>
                </label>
              )}
              {imageError && (
                <p className="image-error" role="alert">
                  {imageError}
                </p>
              )}
            </div>
            <Button type="submit">
              Post task <Icon name="arrow" size={18} />
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
          {posted && (
            <article className="request-card new-request">
              <div className="request-top">
                <div className="request-summary">
                  <img
                    src={taskImage || servicePhotos.repair}
                    alt={taskImage ? "Attached task" : ""}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <StatusChip>Open</StatusChip>
                    <h3>{title || "Fix ceiling fan"}</h3>
                    <p>
                      {customCategory || category} · Budget {budget} ·{" "}
                      {location} · Posted just now
                    </p>
                  </div>
                </div>
                <span className="waiting">
                  <span /> Waiting for bids
                </span>
              </div>
            </article>
          )}
          <article className="request-card">
            <div className="request-top">
              <div className="request-summary">
                <img
                  src={servicePhotos.repair}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <StatusChip
                    type={
                      completed || bids.some((b) => b.status === "accepted")
                        ? "accepted"
                        : "open"
                    }
                  >
                    {completed
                      ? "Completed"
                      : bids.some((b) => b.status === "accepted")
                        ? "Booked"
                        : "Open"}
                  </StatusChip>
                  <h3>Fix a leaking kitchen tap</h3>
                  <p>Home repairs · Budget ₹500 · Needed tomorrow</p>
                </div>
              </div>
              <strong>{bids.length} bids</strong>
            </div>
            <div className="bid-list">
              {sorted.map((b) => (
                <BidRow
                  key={b.id}
                  bid={b}
                  actions
                  onChat={openChat}
                  onAccept={accept}
                  onViewProfile={setProfileBid}
                />
              ))}
            </div>
            {acceptedBid && (
              <div
                className={`completion-prompt ${completed ? "is-done" : ""}`}
              >
                <span>
                  <Icon name={completed ? "check" : "shield"} />
                </span>
                <div>
                  <strong>
                    {completed
                      ? "Task complete and reviewed"
                      : "Is the job finished?"}
                  </strong>
                  <p>
                    {completed
                      ? `Your review now appears on ${acceptedBid.name}’s profile.`
                      : "Mark it done once the work is finished, then leave a review."}
                  </p>
                </div>
                {!completed && (
                  <Button onClick={() => setFeedbackBid(acceptedBid)}>
                    Mark done & review
                  </Button>
                )}
              </div>
            )}
          </article>
        </section>
      </div>
      {feedbackBid && (
        <FeedbackModal
          provider={feedbackBid}
          onClose={() => setFeedbackBid(null)}
          onSubmit={(rating, comment, image) => {
            const updatedProvider = {
              ...feedbackBid,
              rating: Number(
                (
                  (feedbackBid.rating * feedbackBid.reviews + rating) /
                  (feedbackBid.reviews + 1)
                ).toFixed(1),
              ),
              reviews: feedbackBid.reviews + 1,
              reviewImage: image,
              reviewComment: comment,
            }
            setBids((current) =>
              current.map((bid) =>
                bid.id === feedbackBid.id ? updatedProvider : bid,
              ),
            )
            onProviderReview(updatedProvider)
            setCompleted(true)
            setFeedbackBid(null)
            showToast(
              `Thanks! Your ${rating}-star review was added to ${feedbackBid.name}.`,
            )
          }}
        />
      )}
      {profileBid && (
        <ProviderProfileModal
          provider={profileBid}
          onClose={() => setProfileBid(null)}
        />
      )}
    </main>
  )
}

const nearbyTasks = [
  {
    title: "Mount a 43-inch TV",
    category: "Home repairs",
    budget: "₹700",
    deadline: "Today, 7 pm",
    distance: "0.8 km",
    by: "Priya S. · Domlur",
    photo: servicePhotos.repair,
  },
  {
    title: "Deliver flowers across town",
    category: "Deliveries",
    budget: "₹350",
    deadline: "Tomorrow, 11 am",
    distance: "1.4 km",
    by: "Arjun M. · Ulsoor",
    photo: servicePhotos.delivery,
  },
  {
    title: "Move a study table upstairs",
    category: "Moving",
    budget: "₹600",
    deadline: "Sat, 10 am",
    distance: "2.2 km",
    by: "Neha R. · Indiranagar",
    photo: servicePhotos.moving,
  },
]

function ProviderDashboard({
  setView,
  showToast,
  openChat,
  reviewedProviders,
  currentUser,
}: {
  setView: (v: View) => void
  showToast: (s: string) => void
  openChat: (b: Bid) => void
  reviewedProviders: Record<number, Bid>
  currentUser?: User | null
}) {
  const [placed, setPlaced] = useState<number[]>([])
  const [filter, setFilter] = useState("All jobs")
  const [profileOpen, setProfileOpen] = useState(false)
  const providerProfile: Bid = useMemo(() => {
    if (currentUser) {
      return {
        id: currentUser.id,
        name: currentUser.name,
        initials: currentUser.initials || currentUser.name.slice(0, 2).toUpperCase(),
        tone: currentUser.tone || "mint",
        rating: currentUser.rating ?? 5.0,
        reviews: currentUser.reviews ?? 0,
        distance: currentUser.distance ?? 0.8,
        hours: currentUser.hours ?? 1,
        price: currentUser.price ?? 450,
        role: "Service provider",
        portfolio: currentUser.portfolio || [servicePhotos.repair],
        reviewImage: currentUser.reviewImage,
        reviewComment: currentUser.reviewComment,
      }
    }
    return reviewedProviders[2] ?? initialBids[1]
  }, [currentUser, reviewedProviders])
  const filteredTasks = nearbyTasks.filter((task, index) => {
    if (filter === "Under 2 km") return Number(task.distance.split(" ")[0]) < 2
    if (filter === "Needed today") return index === 0
    if (filter === "Home repairs") return task.category === "Home repairs"
    return true
  })
  const placeBid = async (i: number, title: string, e: FormEvent) => {
    e.preventDefault()
    setPlaced((p) => [...p, i])
    try {
      await api.placeBid(i + 1, 450, 1)
    } catch {}
    showToast(`Bid placed on “${title}”. Good luck!`)
  }
  return (
    <main className="dashboard container">
      <DashboardHeader provider setView={setView} currentUser={currentUser} />
      <div className="stats provider-stats">
        <article>
          <span>Nearby requests</span>
          <strong>12</strong>
          <small>Within 5 km</small>
        </article>
        <article>
          <span>Active bids</span>
          <strong>{4 + placed.length}</strong>
          <small>Waiting for a reply</small>
        </article>
        <article>
          <span>Jobs completed</span>
          <strong>38</strong>
          <small>
            ★ {providerProfile.rating} · {providerProfile.reviews} reviews
          </small>
        </article>
      </div>
      <section className="provider-profile-strip">
        <div className="profile-photo-stack">
          <img src={servicePhotos.repair} alt="" referrerPolicy="no-referrer" />
          <span>
            <Icon name="check" size={15} />
          </span>
        </div>
        <div>
          <strong>Your profile is live nearby</strong>
          <p>
            {providerProfile.rating} rating · {providerProfile.reviews} reviews
            · Available for new work
          </p>
        </div>
        <Button variant="outline" onClick={() => setProfileOpen(true)}>
          View profile
        </Button>
      </section>
      {providerProfile.reviewImage && (
        <section className="latest-review">
          <img
            src={providerProfile.reviewImage}
            alt="Customer review attachment"
          />
          <div>
            <span>Latest customer review</span>
            <strong>★ {providerProfile.rating} · Task completed</strong>
            <p>
              {providerProfile.reviewComment ||
                "Work completed successfully and confirmed by the requester."}
            </p>
          </div>
        </section>
      )}
      <section className="provider-layout">
        <div>
          <div className="section-heading compact">
            <span className="eyebrow">New nearby</span>
            <h2>Jobs you can bid on</h2>
            <p>Sample requests from people in your area.</p>
          </div>
          <div className="job-filters" aria-label="Filter nearby jobs">
            {["All jobs", "Under 2 km", "Needed today", "Home repairs"].map(
              (item) => (
                <button
                  key={item}
                  className={filter === item ? "active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          <div className="task-card-list">
            {filteredTasks.map((task, i) => (
              <article className="nearby-card" key={task.title}>
                <div className="nearby-main">
                  <div className="task-thumb">
                    <img
                      src={task.photo}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span>{task.category}</span>
                    <h3>{task.title}</h3>
                    <p>
                      <Icon name="pin" size={15} /> {task.distance} · {task.by}
                    </p>
                  </div>
                  <div className="task-meta">
                    <strong>{task.budget}</strong>
                    <span>{task.deadline}</span>
                  </div>
                </div>
                {placed.includes(i) ? (
                  <div className="bid-placed">
                    <Icon name="check" />
                    <div>
                      <strong>Bid placed</strong>
                      <span>The requester will be notified.</span>
                    </div>
                  </div>
                ) : (
                  <form
                    className="inline-bid"
                    onSubmit={(e) => placeBid(i, task.title, e)}
                  >
                    <label>
                      <span>Your price</span>
                      <input placeholder="₹ 500" required />
                    </label>
                    <label>
                      <span>Hours needed</span>
                      <input type="number" min="1" placeholder="2" required />
                    </label>
                    <Button type="submit">Place bid</Button>
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
          {[
            ["Repair balcony door", "₹650", "Pending"],
            ["Event setup help", "₹1,200", "Accepted"],
            ["Pick up a parcel", "₹280", "Pending"],
          ].map(([title, price, status]) => (
            <div className="your-bid" key={title}>
              <div>
                <h3>{title}</h3>
                <span>{price} · 2 hours</span>
              </div>
              <div className="your-bid-actions">
                <StatusChip
                  type={status === "Accepted" ? "accepted" : "pending"}
                >
                  {status}
                </StatusChip>
                {status === "Accepted" && (
                  <Button
                    variant="soft"
                    onClick={() =>
                      openChat({
                        id: 20,
                        name: "Aarav Mehta",
                        initials: "AM",
                        tone: "mint",
                        rating: 4.9,
                        reviews: 18,
                        distance: 1.1,
                        hours: 2,
                        price: 1200,
                        role: "Requester",
                      })
                    }
                  >
                    Chat
                  </Button>
                )}
              </div>
            </div>
          ))}
        </aside>
      </section>
      {profileOpen && (
        <ProviderProfileModal
          provider={providerProfile}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </main>
  )
}

function ChatPanel({ bid, onClose }: { bid: Bid; onClose: () => void }) {
  const [messages, setMessages] = useState([
    {
      mine: false,
      text: "Hi! I can come by tomorrow afternoon. I’ve handled this repair many times.",
      time: "10:42",
    },
    {
      mine: true,
      text: "Great. Does your bid include any replacement parts?",
      time: "10:44",
    },
  ])
  const [text, setText] = useState("")
  const [typing, setTyping] = useState(false)
  const send = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setMessages((m) => [...m, { mine: true, text, time: "Now" }])
    setText("")
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((m) => [
        ...m,
        {
          mine: false,
          text: "Yes, basic parts are included. I can send photos of similar work too.",
          time: "Now",
        },
      ])
    }, 1400)
  }
  return (
    <section className="chat-panel" aria-label={`Chat with ${bid.name}`}>
      <header>
        <Avatar initials={bid.initials} tone={bid.tone} size="sm" />
        <div>
          <strong>{bid.name}</strong>
          <span>
            {bid.role ?? "Service provider"} · Bid ₹{bid.price}
          </span>
        </div>
        <button onClick={onClose} aria-label="Close chat">
          <Icon name="close" />
        </button>
      </header>
      <div className="messages">
        {messages.map((m, i) => (
          <div className={`message ${m.mine ? "mine" : ""}`} key={i}>
            <p>{m.text}</p>
            <span>{m.time}</span>
          </div>
        ))}
        {typing && (
          <div className="typing" aria-label="Provider is typing">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
      <form onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          aria-label="Message"
        />
        <Button type="submit" aria-label="Send message">
          <Icon name="send" />
        </Button>
      </form>
    </section>
  )
}

function Footer() {
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

export default function App() {
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("neednow_current_view")
      if (saved === "requester" || saved === "provider") return saved
    }
    return "home"
  })
  const [authOpen, setAuthOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pendingTask, setPendingTask] = useState(false)
  const [toast, setToast] = useState("")
  const [chatBid, setChatBid] = useState<Bid | null>(null)
  const [taskDraft, setTaskDraft] = useState<TaskDraft>({})
  const [helplineOpen, setHelplineOpen] = useState(false)
  const [reviewedProviders, setReviewedProviders] =
    useState<Record<number, Bid>>({})

  useEffect(() => {
    api.getMe().then((user) => {
      if (user) {
        setCurrentUser(user)
        setIsLoggedIn(true)
      }
    }).catch(() => {})
  }, [])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(""), 4200)
  }
  const changeView = (next: View) => {
    if (next === "requester" && !isLoggedIn) {
      setPendingTask(true)
      setAuthOpen(true)
      return
    }
    setView(next)
    if (typeof window !== "undefined") {
      localStorage.setItem("neednow_current_view", next)
    }
    setChatBid(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const startTask = (draft: TaskDraft) => {
    setTaskDraft(draft)
    if (!isLoggedIn) {
      setPendingTask(true)
      setAuthOpen(true)
      return
    }
    changeView("requester")
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
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={() => {
          api.logout()
          setCurrentUser(null)
          setIsLoggedIn(false)
          setTaskDraft({})
          if (typeof window !== "undefined") {
            localStorage.removeItem("neednow_current_view")
          }
        }}
      />
      {view === "home" && (
        <Landing setView={changeView} startTask={startTask} />
      )}
      {view === "requester" && (
        <RequesterDashboard
          setView={changeView}
          showToast={showToast}
          openChat={setChatBid}
          initialDraft={taskDraft}
          currentUser={currentUser}
          onProviderReview={(provider) =>
            setReviewedProviders((current) => ({
              ...current,
              [provider.id]: provider,
            }))
          }
        />
      )}
      {view === "provider" && (
        <ProviderDashboard
          setView={changeView}
          showToast={showToast}
          openChat={setChatBid}
          reviewedProviders={reviewedProviders}
          currentUser={currentUser}
        />
      )}
      {view === "home" && <Footer />}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onLogin={(user, role) => {
            const nextView = pendingTask ? "requester" : role
            setCurrentUser(user)
            setIsLoggedIn(true)
            setAuthOpen(false)
            setView(nextView)
            if (typeof window !== "undefined") {
              localStorage.setItem("neednow_current_view", nextView)
            }
            setChatBid(null)
            window.scrollTo({ top: 0, behavior: "smooth" })
            setPendingTask(false)
            showToast(`Welcome, ${user.name}! You’re logged in.`)
          }}
        />
      )}
      {chatBid && <ChatPanel bid={chatBid} onClose={() => setChatBid(null)} />}
      <button
        className="helpline-button"
        onClick={() => setHelplineOpen((open) => !open)}
        aria-expanded={helplineOpen}
        aria-label="Open demo helpline"
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
        <section className="helpline-popover" aria-label="Demo helpline">
          <button
            className="helpline-close"
            onClick={() => setHelplineOpen(false)}
            aria-label="Close helpline"
          >
            <Icon name="close" size={17} />
          </button>
          <span className="status status-pending">Demo helpline</span>
          <h3>How can we help?</h3>
          <p>For questions about tasks, bids or bookings.</p>
          <strong>1800 000 3636</strong>
          <Button
            variant="dark"
            onClick={() => {
              setHelplineOpen(false)
              showToast("Demo only — a support call would start here.")
            }}
          >
            <Icon name="phone" size={16} /> Call support
          </Button>
        </section>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" />
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}

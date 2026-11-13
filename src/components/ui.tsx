import { type ReactNode } from "react"
import { initialBids } from "../data"
import { type Bid } from "../types"

export const iconPaths: Record<string, ReactNode> = {
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

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
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

export function Button({
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

export function Avatar({
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

export function StatusChip({
  children,
  type = "open",
}: {
  children: ReactNode
  type?: string
}) {
  return <span className={`status status-${type}`}>{children}</span>
}

export function BidRow({
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
  const decided = bid.status === "accepted" || bid.status === "not-selected"
  return (
    <div className={`bid-row ${decided ? `bid-${bid.status}` : ""}`}>
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
          <b>★ {bid.rating}</b> ({bid.reviews})
          {bid.distance != null && ` · ${bid.distance} km`}
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
          {!decided && onAccept && (
            <Button onClick={() => onAccept(bid)}>Accept bid</Button>
          )}
        </div>
      )}
      {decided && (
        <StatusChip type={bid.status === "accepted" ? "accepted" : "muted"}>
          {bid.status === "accepted" ? "Accepted" : "Not selected"}
        </StatusChip>
      )}
    </div>
  )
}

export function BidCard({ bids = initialBids }: { bids?: Bid[] }) {
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

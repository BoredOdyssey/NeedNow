import { type FormEvent, useEffect, useState } from "react"
import { api, type ProviderProfile, type User } from "../api"
import { Avatar, Button, Icon } from "./ui"
import { servicePhotos } from "../data"
import { usePhotoUpload } from "../usePhotoUpload"
import { type Bid, type View } from "../types"

export function AuthModal({
  onClose,
  onLogin,
}: {
  onClose: () => void
  onLogin: (user: User) => void
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
        onLogin(res.user)
      } else {
        const res = await api.login(email, password)
        onLogin(res.user)
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
          <small>College project. Use the demo accounts in the README or create your own.</small>
        </div>
      </section>
    </div>
  )
}

export function FeedbackModal({
  provider,
  onClose,
  onSubmit,
}: {
  provider: Bid
  onClose: () => void
  onSubmit: (rating: number, comment: string, imageUrl?: string) => Promise<void>
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const photo = usePhotoUpload()
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
          onSubmit={async (e) => {
            e.preventDefault()
            if (!rating) {
              setError("Choose a star rating before submitting.")
              return
            }
            setSubmitting(true)
            setError("")
            try {
              await onSubmit(rating, comment, photo.url || undefined)
            } catch (err) {
              setError((err as Error).message)
              setSubmitting(false)
            }
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
                ? ["", "Needs improvement", "Fair", "Good", "Very good", "Excellent"][rating]
                : "Tap a star to rate"}
            </span>
          </fieldset>
          <label className="field">
            <span>Share a few words (optional)</span>
            <textarea
              rows={4}
              value={comment}
              maxLength={1000}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the work on time? Was communication clear?"
            />
          </label>
          <div className="field">
            <span>Finished-work photo (optional)</span>
            {photo.url ? (
              <div className="feedback-image-preview">
                <img src={photo.url} alt="Review attachment preview" />
                <button type="button" onClick={photo.clear}>
                  <Icon name="close" size={16} /> Remove
                </button>
              </div>
            ) : (
              <label className="feedback-image-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={photo.uploading}
                  onChange={(e) => photo.pick(e.target.files?.[0])}
                />
                <Icon name="camera" size={18} />
                <span>
                  <strong>{photo.uploading ? "Uploading…" : "Attach a photo"}</strong>
                  <small>Show the finished work</small>
                </span>
              </label>
            )}
            {photo.error && (
              <p className="image-error" role="alert">
                {photo.error}
              </p>
            )}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting || photo.uploading}>
            {submitting ? "Submitting…" : "Submit review"} <Icon name="arrow" size={17} />
          </Button>
        </form>
      </section>
    </div>
  )
}

export function ProviderProfileModal({
  provider,
  onClose,
}: {
  provider: { id: number; name: string; initials: string; tone: string }
  onClose: () => void
}) {
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    api.getProvider(provider.id).then(setProfile, (err: Error) => setError(err.message))
  }, [provider.id])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [onClose])
  const latestReview = profile?.customerReviews[0]
  const portfolio = profile?.portfolio.length ? profile.portfolio : [servicePhotos.repair]
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
          <img src={portfolio[0]} alt="Recent work" referrerPolicy="no-referrer" />
        </div>
        <div className="profile-body">
          <div className="profile-identity">
            <Avatar initials={provider.initials} tone={provider.tone} size="lg" />
            <div>
              <div className="profile-name-row">
                <h2 id="profile-title">{provider.name}</h2>
              </div>
              <p>{profile?.services.slice(0, 2).join(" and ") || "Local service provider"}</p>
            </div>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {!profile && !error && <p>Loading profile…</p>}
          {profile && (
            <>
              <div className="profile-metrics">
                <div>
                  <strong>★ {profile.rating}</strong>
                  <span>{profile.reviews} reviews</span>
                </div>
                <div>
                  <strong>{profile.jobsCompleted}</strong>
                  <span>Jobs completed</span>
                </div>
                {profile.distance != null && (
                  <div>
                    <strong>{profile.distance} km</strong>
                    <span>From you</span>
                  </div>
                )}
              </div>
              {profile.services.length > 0 && (
                <div className="profile-section">
                  <h3>Services</h3>
                  <div className="profile-tags">
                    {profile.services.map((service) => (
                      <span key={service}>{service}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.bio && (
                <div className="profile-section">
                  <h3>About</h3>
                  <p>{profile.bio}</p>
                </div>
              )}
              <div className="profile-section">
                <div className="portfolio-heading">
                  <h3>Previous work</h3>
                  <span>{portfolio.length} photos</span>
                </div>
                <div className="portfolio-grid">
                  {portfolio.map((photo, index) => (
                    <figure key={photo}>
                      <img
                        src={photo}
                        alt={`Previous work example ${index + 1}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </figure>
                  ))}
                </div>
              </div>
              {latestReview && (
                <div className="profile-review">
                  {latestReview.imageUrl && (
                    <img src={latestReview.imageUrl} alt="Customer review attachment" />
                  )}
                  <div>
                    <span>Latest review · {latestReview.requesterName}</span>
                    <strong>★ {latestReview.rating}</strong>
                    <p>{latestReview.comment || "Work completed and confirmed by the requester."}</p>
                  </div>
                </div>
              )}
            </>
          )}
          <Button variant="outline" onClick={onClose}>
            Close profile
          </Button>
        </div>
      </section>
    </div>
  )
}

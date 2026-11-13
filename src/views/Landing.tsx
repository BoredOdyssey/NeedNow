import { useState } from "react"
import { Avatar, BidCard, Button, Icon } from "../components/ui"
import { categories, servicePhotos } from "../data"
import { type TaskDraft, type View } from "../types"

export function TaskWidget({ onPost }: { onPost: (draft: TaskDraft) => void }) {
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

export function PeopleIllustration() {
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

export function Landing({
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

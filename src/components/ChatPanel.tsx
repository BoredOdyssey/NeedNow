import { type FormEvent, useEffect, useRef, useState } from "react"
import { api, type Message } from "../api"
import { Avatar, Button, Icon } from "./ui"
import { type ChatTarget } from "../types"

const POLL_MS = 4000

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

export function ChatPanel({ chat, onClose }: { chat: ChatTarget; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const lastId = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)

  const append = (incoming: Message[]) => {
    const fresh = incoming.filter((m) => m.id > lastId.current)
    if (!fresh.length) return
    lastId.current = fresh[fresh.length - 1].id
    setMessages((current) => [...current, ...fresh])
  }

  // Load the thread, then poll for anything newer than the last message.
  useEffect(() => {
    lastId.current = 0
    setMessages([])
    setError("")
    const load = () =>
      api
        .getMessages(chat.taskId, { providerId: chat.providerId, after: lastId.current })
        .then(append, (err: Error) => setError(err.message))
    load()
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [chat.taskId, chat.providerId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      append([await api.sendMessage(chat.taskId, text.trim(), chat.providerId)])
      setText("")
      setError("")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="chat-panel" aria-label={`Chat with ${chat.name}`}>
      <header>
        <Avatar initials={chat.initials} tone={chat.tone} size="sm" />
        <div>
          <strong>{chat.name}</strong>
          <span>{chat.subtitle}</span>
        </div>
        <button onClick={onClose} aria-label="Close chat">
          <Icon name="close" />
        </button>
      </header>
      <div className="messages" ref={listRef}>
        {messages.length === 0 && !error && <p className="chat-empty">No messages yet. Say hello!</p>}
        {messages.map((m) => (
          <div className={`message ${m.mine ? "mine" : ""}`} key={m.id}>
            <p>{m.text}</p>
            <span>{timeOf(m.createdAt)}</span>
          </div>
        ))}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <form onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          aria-label="Message"
          maxLength={1000}
        />
        <Button type="submit" aria-label="Send message" disabled={sending}>
          <Icon name="send" />
        </Button>
      </form>
    </section>
  )
}

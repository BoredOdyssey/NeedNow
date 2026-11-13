# NeedNow Marketplace - Zero-Install Backend API

A lightweight, zero-dependency, production-ready backend built exclusively with **native Node.js standard modules** (`node:http`, `node:crypto`, `node:fs`, `node:path`, `node:url`).

---

## 🌟 Why Zero-Install?
- 📦 **0 npm packages to install**: No `npm install`, no compilation, no node-gyp build tools needed.
- 💸 **100% Free**: Zero cost, zero API keys, no paid databases, and no subscriptions.
- ⚡ **Instant Startup**: Launches in under 50ms with `node server.js`.
- 🔒 **Cryptographically Secure**: Built-in PBKDF2 password hashing and HMAC-SHA256 JWT tokens.
- 💾 **Persistent ACID Storage**: Transactional atomic file-backed JSON database in `server/data/database.json`.
- 📡 **Real-time Server-Sent Events (SSE)**: Live streaming of bids, acceptances, and messages.

---

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
# From project root
npm run server

# Or directly with node
node server/server.js
```
The server will start at:
- **API Base**: `http://localhost:5000`
- **Real-Time Stream**: `http://localhost:5000/api/events`

### 2. Run the Automated API Test Suite
```bash
npm run server:test
# Or
node server/test.js
```
Runs 15 automated test cases validating all authentication, task, bidding, review, and chat routes.

---

## 🔑 Pre-Seeded Demo Accounts
Password for all demo accounts: **`Password123`**

| Role | Name | Email | Details |
|---|---|---|---|
| **Requester** | Ananya Sharma | `ananya@example.com` | Indiranagar requester with open tasks |
| **Provider** | Ravi Kumar | `ravi@example.com` | Rated 4.8 ★ · 91 reviews · 0.8 km away |
| **Provider** | Meera Plumbing | `meera@example.com` | Rated 4.9 ★ · 128 reviews · 1.2 km away |
| **Provider** | Sanjay Verma | `sanjay@example.com` | Rated 4.7 ★ · 63 reviews · 2.1 km away |

---

## 📡 REST API Reference

### 🔐 Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (`name`, `email`, `password`, `phone`, `role`) | No |
| `POST` | `/api/auth/login` | Login with credentials (`email`, `password`) | No |
| `GET` | `/api/auth/me` | Get currently authenticated profile | Bearer Token |

### 📋 Tasks (Requests)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/tasks` | List marketplace tasks | `?category=...&status=...&maxDistance=...` |
| `GET` | `/api/tasks/:id` | Get specific task details + bids + chat | - |
| `POST` | `/api/tasks` | Create a new task | `{ title, category, location, budget, neededBy, details, imageUrl }` |
| `POST` | `/api/tasks/:id/complete` | Complete task & leave verified review | `{ rating, comment, imageUrl }` |

### 💰 Reverse Bidding
| Method | Endpoint | Description | Details |
|---|---|---|---|
| `GET` | `/api/tasks/:id/bids` | Get bids for a task | Returns price, rating, distance, hours |
| `POST` | `/api/tasks/:id/bids` | Submit a bid (provider) | `{ price: 480, hours: 2 }` |
| `POST` | `/api/bids/:id/accept` | Accept a bid (requester) | Marks task `booked`, other bids `not-selected` |
| `GET` | `/api/provider/bids` | Get provider's placed bids | Returns status (`pending`, `accepted`) |

### ⭐ Providers & Profiles
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/providers/:id` | Full provider profile: rating, review count, portfolio, customer reviews |

### 💬 Messaging & Real-Time Chat
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks/:id/messages` | Conversation history for this task |
| `POST` | `/api/tasks/:id/messages` | Send message `{ text, recipientId, senderRole }` |
| `GET` | `/api/events` | Server-Sent Events (SSE) live push stream |

### 📞 Helpline & Stats
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/helpline` | Submit a support / callback request |
| `GET` | `/api/stats` | Active counts: open requests, total bids, booked jobs |
| `GET` | `/api/health` | Server uptime and health status |

---

## ☁️ Free Hosting Options
When you want to deploy this backend online for free:
1. **Render (Free Tier)**:
   - Create a Web Service pointing to `node server/server.js` (Root directory: `server`).
   - 100% Free with automatic HTTPS.
2. **Railway (Free Starter)**:
   - Connect your GitHub repo, select Node.js service.
3. **Fly.io (Free Tier)**:
   - Run `fly launch` with Node.js runtime.

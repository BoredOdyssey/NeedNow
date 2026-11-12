# NeedNow Marketplace (Full-Stack)

A complete, full-stack **hyperlocal reverse bidding marketplace for everyday services** (Bengaluru / Indiranagar theme) with React 19, Tailwind CSS v4, Vite, and a zero-dependency, 100% free Node.js backend.

---

## ⚡ What was Built

1. **Zero-Install Node.js Backend (`server/`)**:
   - Built exclusively with **native Node.js standard modules** (`node:http`, `node:crypto`, `node:fs`, `node:path`, `node:url`).
   - **0 external dependencies required** (no `npm install` needed for backend).
   - **100% Free**: No API keys, no paid database subscriptions, works completely offline.
   - **Cryptographic Security**: PBKDF2 password hashing + HMAC-SHA256 JWT tokens.
   - **ACID Persistent Database**: Atomic file-backed JSON database in `server/data/database.json`.
   - **Real-Time Streaming**: Server-Sent Events (SSE) stream at `/api/events`.
   - **Automated Test Suite**: 15/15 tests passing in `server/test.js`.

2. **Frontend-Backend Integration (`src/api.ts` & `src/App.tsx`)**:
   - **Authentication**: Real user signup and login for Requesters & Providers with JWT storage and session persistence.
   - **Task Management**: Requesters post real tasks with category, budget, deadline, and photo attachments; saved directly to the database.
   - **Reverse Bidding**: Providers submit real bids (price and hours); requesters view, sort, and accept bids.
   - **Task Completion & Reviews**: Finished-work photo upload with 1–5 star ratings and reviews; auto-recalculates provider rating averages in the database.
   - **Messaging & Chat**: Live chat between requesters and providers persisted to the database with SSE / polling updates.
   - **Helpline**: Support callback tickets recorded in the backend.
   - **Vite Proxy**: `/api` requests automatically proxy to the backend on port 5000 in development.

---

## 🚀 Running the Project

### ⚡ Run Both Together (Single Command)
To run both the **backend API** and the **frontend Vite UI** simultaneously in one terminal:
```bash
npm run dev
# or
npm start
```
- **Backend API**: Running at `http://localhost:5000`
- **Frontend App**: Running with automatic proxy of `/api` to port 5000
- **Database**: Local atomic JSON database in `server/data/database.json`

### 🔧 Or Run Individually:
- **Backend only**: `npm run server`
- **Frontend only**: `npm run dev:ui`
- **Run automated test suite (15/15 passing)**: `npm run server:test`

---

## 👥 Demo Logins
All accounts use password: **`Password123`**

- **Requester**: `ananya@example.com` (Ananya Sharma, Indiranagar)
- **Provider (Technician)**: `ravi@example.com` (Ravi Kumar, 4.8 ★, 91 reviews)
- **Provider (Plumbing)**: `meera@example.com` (Meera Plumbing Works, 4.9 ★, 128 reviews)
- **Provider (Electrical & Carpentry)**: `sanjay@example.com` (Sanjay Verma, 4.7 ★, 63 reviews)

*(You can also click the quick demo buttons on the login modal to log in with 1 click!)*

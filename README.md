# 📡 Live Classroom – Real-Time Polling System

A real-time classroom polling platform built for live interaction between teachers and students. Teachers create timed polls, students respond in real time, and results update live — all with resilient state recovery, anti-cheat enforcement, and a polished UI.

---

## 🚀 Live Demo

| Layer    | URL                                      |
| -------- | ---------------------------------------- |
| Frontend | `https://live-polling-system-sakshi.vercel.app/`       |
| Backend  | `https://live-polling-system-03wu.onrender.com`      |

---

## 📌 Overview

Live Classroom is a two-persona real-time polling system:

- **Teacher** — Creates timed multiple-choice polls, monitors live vote distribution, manages participants, and reviews poll history.
- **Student** — Joins a session by name, answers polls within the countdown, and receives instant feedback (correct / incorrect / missed).

The system is designed around **resilience**: page refreshes, late joins, and network interruptions are handled gracefully. The server is the single source of truth for timers, votes, and poll state — the client never drifts.

---

## 🏗 Architecture

```
┌──────────────────┐         WebSocket (Socket.io)        ┌──────────────────┐
│                  │ ◄──────────────────────────────────► │                  │
│   React Client   │         REST (Express)               │   Node Server    │
│   Vite + TS      │ ◄──────────────────────────────────► │   Express + TS   │
│   TailwindCSS    │                                      │   Socket.io      │
└──────────────────┘                                      └────────┬─────────┘
                                                                   │
                                                          ┌────────▼─────────┐
                                                          │    MongoDB       │
                                                          │    (Atlas)       │
                                                          └──────────────────┘
```

### Backend

- **Controller–Service pattern** — Routes delegate to services; business logic is decoupled from HTTP/socket transport.
- **Socket.io event-driven architecture** — Dedicated socket handler files per module (`poll.socket.ts`, `student.socket.ts`, `chat.socket.ts`).
- **MongoDB persistence** — Polls, votes, students, and chat messages are persisted. In-memory maps track live socket connections.
- **Server-authoritative timer** — The server emits `startedAt` + `durationSec` + `serverTime`; clients compute countdown locally with offset correction.

### Frontend

- **Custom hooks** — `useActivePoll`, `useParticipants`, `useChat`, `usePollTimer`, `useKickListener`, `useSocketErrors`, `useStudentSession`.
- **Context-based socket** — A single `SocketProvider` manages the WebSocket lifecycle; all pages consume it via `useSocket()`.
- **Clean page separation** — Each route has its own page component with no shared mutable state leaking across views.

---

## 🔥 Core Features

### Real-Time Polling

- Teacher creates a multiple-choice poll with 2–6 options, marks the correct answer, and sets a timer (30 / 45 /  seconds).
- Students see the poll instantly via WebSocket and vote within the countdown.
- Results update live on both the teacher dashboard and student results screen.

### Timer Synchronization

- Timer is computed from server-emitted `startedAt` and `serverTime`, eliminating client clock drift.
- Students who join mid-poll see the correct remaining time — not a full reset.
- A reusable `usePollTimer` hook powers all timer displays with consistent behavior.

### State Recovery on Refresh

- Refreshing any page re-fetches the active poll state from the server.
- Voted status is persisted in `sessionStorage` — students cannot re-vote after refresh.
- The chosen option is remembered and shown on the results screen after refresh.

### Live Teacher Dashboard

- Real-time vote distribution with animated percentage bars.
- "X / Y students have responded" counter updates live as votes arrive.
- Per-option vote counts displayed inline.
- Participant list with kick functionality.

### Student Onboarding

- Students enter a display name and receive a unique `studentKey` (persisted in `sessionStorage`).
- Each browser tab acts as an independent session.
- Kicked students are blocked from re-joining (enforced server-side via DB).

### Early Poll Termination

- When all eligible students have voted, the poll ends immediately — no waiting for the timer.
- Late-joining students are dynamically added to the eligible list so the poll doesn't end prematurely.

---

## 🛡 Resilience & Data Integrity

| Concern                     | Implementation                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| **One vote per student**    | Unique compound index `(pollId, studentKey)` in MongoDB. Duplicate votes are rejected server-side.  |
| **DB-backed enforcement**   | Votes are written to MongoDB, not just held in memory. Server restarts don't lose data.             |
| **Server-side validation**  | `poll:vote` validates poll is active and not expired. `poll:create` rejects if an active poll exists.|
| **Refresh-safe state**      | `poll:active` is re-emitted on every `student:join` / `teacher:join`. Voted flags use sessionStorage.|
| **Kicked student blocking** | `isKicked()` is checked on `student:join`, `poll:vote`, and `chat:send`. Kicked students cannot rejoin.|
| **Atomic upserts**          | `StudentModel.findOneAndUpdate` with `upsert: true` prevents race conditions on concurrent joins.  |
| **ACK callbacks**           | Critical events (`poll:create`, `poll:vote`, `chat:send`) use Socket.io ACKs for reliable feedback. |

---

## 🎯 UX Enhancements

### Answer Feedback

- **Correct answer** → Confetti burst (via `canvas-confetti`) + celebratory chime (Web Audio API) + "Well done! 🎉" green badge.
- **Incorrect answer** → Animated sad emoji (😢) glide-up + descending "wah-wah" sound + "Better luck next time!" yellow badge + red border on chosen option.
- **Missed (didn't submit)** → Animated hourglass (⏳) bounce-in + ticking clock sound + deep gong + "Time's up! You didn't submit an answer." yellow badge + "Missed" red pill + correct option highlighted in green.

### Visual Polish

- Correct option gets a **green border + light green background** on results.
- Incorrect chosen option gets a **red border + light red background**.
- Student's chosen option plays a **shake animation** when results appear.
- All audio is synthesized via the Web Audio API — zero external audio files.

### Dynamic Timer

- 🟢 **Green** when > 50% time remaining.
- 🟡 **Yellow** when 20–50% remaining.
- 🔴 **Red** when < 20% remaining or poll ended.

### Live Participation Tracking

- "X / Y students have responded" updates in real time on the teacher dashboard.
- X turns **green** when all students have answered, **red** otherwise.
- Per-option vote counts update live inside the results bar.

### Participant Management

- Real-time participant list with **colorful initial-based avatars**.
- Teacher can **kick** students — kicked students are disconnected and blocked from re-joining.
- Participant count updates in real time for both teacher and students.

### In-App Chat

- Real-time chat powered by Socket.io with MongoDB persistence (linked to `pollId`).
- Chat history is loaded on join and synced across refreshes.
- **Typing indicators**: "Rahul is typing…", "Rahul, Priya are typing…", "Multiple people are typing…" — throttled to prevent network spam, auto-clears after 1.2s.
- Teacher can **clear chat history** (button disabled when chat is empty).
- Messages styled with purple (own) and dark grey (others) bubbles.
- Rate limited: max 5 messages per 5 seconds per socket.

### Poll History

- View all completed polls with questions, options, and result distributions.
- Teacher can **clear poll history** with a single click.
- "Back to Results" navigation button.

---

## ⚙️ Local Setup

### Prerequisites

- Node.js 20.x
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/live-classroom.git
cd live-classroom
```

### 2. Install Dependencies

```bash
npm run install:all
```

This installs root, server, and client dependencies in one command.

### 3. Configure Environment Variables

**Server** — Create `server/.env`:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/intervue_poll
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Client** — Create `client/.env`:

```env
VITE_API_URL=http://localhost:5001
```

### 4. Run Development Servers

```bash
npm run dev
```

This starts both server (port 5001) and client (port 5173) concurrently.

### 5. Production Build

```bash
# Server
cd server && npm run build

# Client
cd client && npm run build
```

---

## 🌍 Deployment Architecture

```
┌─────────────┐       ┌──────────────┐       ┌────────────────┐
│   Vercel     │──────►│   Render     │──────►│  MongoDB Atlas │
│  (Frontend)  │  WS   │  (Backend)   │  TCP  │  (Database)    │
└─────────────┘       └──────────────┘       └────────────────┘
```

### Environment Variables

| Service  | Variable       | Value                                  |
| -------- | -------------- | ---------------------------------------|
| Render   | `PORT`         | Render-assigned (via process.env.PORT) |
| Render   | `MONGO_URI`    | MongoDB Atlas connection string        |
| Render   | `CLIENT_URL`   | Vercel frontend URL                    |
| Render   | `NODE_ENV`     | `production`                           |
| Vercel   | `VITE_API_URL` | Render backend URL                     |

### Vercel Configuration

The client includes a `vercel.json` that rewrites all routes to `index.html` for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 🧪 Manual Testing Checklist

| # | Scenario                        | Steps                                                                                       | Expected Result                                                      |
|---|---------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| 1 | **Create a poll**               | Open as Teacher → Fill question, options, mark correct, set timer → Click "Ask Question"    | Poll appears on student screens immediately                          |
| 2 | **Join as student**             | Open new tab → Select Student → Enter name → Wait for poll                                  | Student sees active poll or waiting screen                           |
| 3 | **Vote on a poll**              | As Student, select an option → Click "Submit"                                               | Vote registers, results show with correct/incorrect feedback         |
| 4 | **Refresh during poll**         | Refresh the student tab while a poll is active                                              | Poll state recovers, voted status is preserved                       |
| 5 | **Late join**                   | Join as a new student after poll has started                                                | Timer shows correct remaining time, student can vote                 |
| 6 | **Kick a student**              | As Teacher, open chat panel → Click "Kick out" on a student                                 | Student is disconnected, sees `/kicked` page, cannot rejoin          |
| 7 | **All students voted**          | Have all students vote before timer ends                                                    | Poll ends immediately, results appear                                |
| 8 | **Miss a poll**                 | Let timer expire without voting                                                             | Student sees "Missed" badge, hourglass animation, correct answer highlighted |
| 9 | **View poll history**           | As Teacher, click "View Poll History" after polls have ended                                | All past polls displayed with results                                |
| 10| **Chat**                        | Send messages from teacher and student tabs                                                 | Messages appear in real time on both sides with typing indicators    |

---

## 📂 Folder Structure

```
live-classroom/
├── client/                          # React frontend
│   ├── public/                      # Static assets (favicon)
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/                # FloatingChatButton, ChatParticipantsPanel
│   │   │   ├── poll/                # PollOptionsList, ResultOptionRow
│   │   │   └── ui/                  # PrimaryButton, Toast, shared UI
│   │   ├── contexts/                # SocketContext (singleton WebSocket)
│   │   ├── hooks/                   # useActivePoll, useChat, useParticipants,
│   │   │                            # usePollTimer, useKickListener, etc.
│   │   ├── pages/                   # Home, StudentOnboard, StudentPoll,
│   │   │                            # StudentResults, StudentWait, TeacherCreate,
│   │   │                            # TeacherResults, PollHistory, Kicked
│   │   ├── types/                   # poll.ts, socketEvents.ts
│   │   ├── utils/                   # celebrationSound.ts (Web Audio API)
│   │   ├── App.tsx                  # Route definitions
│   │   └── main.tsx                 # Entry point
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── vercel.json
│
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── config/                  # env.ts, db.ts, cors.ts
│   │   ├── modules/
│   │   │   ├── poll/                # model, service, controller, socket, types
│   │   │   ├── student/             # model, service, controller, socket
│   │   │   ├── chat/                # model, service, controller, socket, types
│   │   │   └── vote/                # model
│   │   ├── routes/                  # health.route.ts
│   │   ├── shared/                  # socketEvents.ts (shared constants)
│   │   ├── app.ts                   # Express app setup
│   │   └── server.ts               # HTTP + Socket.io bootstrap
│   ├── tsconfig.json
│   └── package.json
│
├── package.json                     # Root scripts (concurrently)
└── README.md
```

---

## 👤 Author

**Sakshi Chaurasia**

- GitHub: [github.com/sakshi-292](https://github.com/sakshi-292)
- LinkedIn: [linkedin.com/in/sakshi-chaurasia](https://www.linkedin.com/in/sakshi-chaurasia/)

---

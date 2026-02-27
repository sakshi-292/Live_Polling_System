# Intervue Live Polling System

Real-time polling system for teachers and students built with React, Node/Express, Socket.io, and MongoDB.

## Tech Stack

| Layer    | Tech                          |
| -------- | ----------------------------- |
| Frontend | React 19 + TypeScript + Vite  |
| Backend  | Node.js + Express + TypeScript|
| Realtime | Socket.io (coming soon)       |
| Database | MongoDB (coming soon)         |

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Install Dependencies

```bash
# From the project root – installs root, server, and client deps
npm run install:all
```

### Run in Development

```bash
# Start both server (port 5000) and client (port 5173) concurrently
npm run dev

# Or run individually
npm run dev:server   # server only
npm run dev:client   # client only
```

### Verify

- Client: [http://localhost:5173](http://localhost:5173)
- Server health check: [http://localhost:5000/health](http://localhost:5000/health) → `{ "ok": true }`

## Project Structure

```
├── package.json          # Root scripts (concurrently)
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── src/
│       ├── server.ts         # Entry point – starts Express
│       ├── app.ts            # Express app setup
│       ├── config/
│       │   ├── env.ts        # Environment variables
│       │   └── cors.ts       # CORS configuration
│       └── routes/
│           └── health.route.ts
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx           # Router setup
        ├── App.css
        ├── index.css
        └── pages/
            ├── Home.tsx      # Role selection (/ route)
            ├── Teacher.tsx   # /teacher placeholder
            └── Student.tsx   # /student placeholder
```

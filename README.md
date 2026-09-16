# FIND X — Next-Gen Cryptic Hunt & Puzzle Platform
**Target Institution**: Indian Institute of Information Technology, Lucknow (IIITL)  
**Aesthetic**: Refined Modern Enigma (Tactile Mineral Slate, Lucid Cyan, Precision Amber, Electric Emerald)

---

## Overview
**FIND X** is a high-stakes, competitive, multimedia cryptic hunt platform built with Next.js 16 (App Router, Server Actions, React 19), Prisma ORM, and Three.js. It features a progressive puzzle ladder, multimedia clue viewers (audio waveforms, forensic silhouette filters, PDF ciphers), anti-brute force Redis-backed lockouts, dual-tier leaderboards with timeline velocity graphs, and strict domain-driven team management.

---

## Key Invariants & Features

1. **Authentication & Domain Whitelist**:
   - Only IIITL college emails matching `^l(cs|it|ci|cb)20(23|24|25|26)(0\d{2}|\d{3})@iiitl\.ac\.in$` can authenticate.
   - Extracts branch (`cs`, `it`, `ci`, `cb`), batch year (`2023`-`2026`), roll number, and automatically computes `isFirstYear = (batchYear === 2026)`.
   - Organizers access via `ADMIN_EMAILS` whitelist.
   - Dev Mock Auth mode available for instant testing without requiring external Google OAuth keys.

2. **Decentralized Team Formation & Zero Cross-Batch Mixing**:
   - Squad size: Min 1, Max 3 members.
   - **Zero Cross-Batch Mixing**: Freshers (`2026`) can ONLY team up with freshers. Seniors (`2023-2025`) can ONLY team up with seniors.
   - **Atomic Acceptance**: A user can broadcast join requests to multiple teams simultaneously. When any squad accepts them in a serializable transaction, all their other pending requests are atomically purged.
   - **Voluntary Exit Only (NO Kick Option)**: No squad member can kick another. Members can voluntarily exit while the team score is 0. If a squad reaches 0 members, it automatically disbands.
   - **Q1 Roster Freeze**: The moment a squad submits their first correct answer, the roster permanently locks. No joins or departures are permitted post-Q1.

3. **Anti-Brute Force Lockout State Machine**:
   - Submissions are evaluated strictly server-side with normalized regex.
   - 5 wrong attempts on a puzzle within 2 minutes triggers a 5-minute cooldown lockout with real-time HTTP 429 countdown telemetry.
   - Organizers can manually unlock teams from the Admin console.

4. **Timed Hints with Teammate Attribution**:
   - Hints unlock after configured time delays and deduct custom points from the puzzle's base score.
   - 2-step confirmation modal warns of point deductions.
   - The platform attributes and broadcasts which squad member authorized the hint unlock.
   - Puzzle net score is floored at 0 points.

5. **Dual-Tier Leaderboard & Live Step-Line Chart**:
   - 1st-Year Track (`2026`) vs Open/Senior Track (`2023-2025`) vs Combined Podium.
   - Interactive Top 10 timeline graph tracking score progression chronologically.
   - Leaderboard Freeze toggle: Organizers can freeze the public board during final hours to build suspense while squads still view their own live progress privately.

6. **Interactive 3D Decryption Prism**:
   - Interactive Three.js polyhedral core responding to cursor physics and solve velocity.

---

## Tech Stack (100% Free-Tier Architecture)
- **Frontend & Framework**: Next.js 16 (App Router, Server Actions, React 19, TypeScript Strict Mode)
- **Styling**: Tailwind CSS v4, Framer Motion, Canvas Confetti
- **3D**: Three.js WebGL canvas
- **Database & ORM**: PostgreSQL via Prisma 6 (free on Neon or Supabase; local fallback ready)
- **Cache & Rate-Limiting**: Redis / Upstash (with built-in resilient in-memory fallback)
- **Auth**: NextAuth.js (Google OAuth + Dev Mock provider)
- **Charts**: Recharts (step-line timeline)

---

## Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Local Database & Redis (Optional via Docker)
To run local PostgreSQL and Redis containers:
```bash
docker compose up -d
```
Alternatively, connect your free-tier Neon/Supabase PostgreSQL and Upstash Redis connection strings in `.env`.

### 3. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

- `npm run dev`: Launch development server with hot reloading at `http://localhost:3000`.
- `npm run build`: Compile and optimize application for production (standalone mode).
- `npm run start`: Launch compiled standalone production server.
- `npm run lint`: Run ESLint static analysis across all TypeScript/React files.

---

## Production Deployment

### Option A: Self-Hosted Docker Compose (Recommended)

Run the full production stack including web application, PostgreSQL, and Redis:

```bash
# 1. Configure production environment
cp .env.example .env
# Edit .env with your domain, secrets, and database credentials

# 2. Build and launch containers in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# 3. Apply Prisma database schema to production database
npx prisma db push
```

The stack automatically monitors container health via the `/api/health` endpoint and restarts on failure.

### Option B: Bare-Metal / VPS Node.js

```bash
npm ci
npx prisma generate
npm run build
npm run start
```

---

## Health Check & Telemetry

- **Endpoint**: `GET /api/health`
- **Response**: `{ "status": "healthy", "uptime": ..., "timestamp": ..., "database": "connected" }`
- **Usage**: Suitable for cloud load balancers, Kubernetes probes, Uptime Kuma, and Docker container healthchecks.


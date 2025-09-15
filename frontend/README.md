# UniSync

?? All sections are completed as requested.

?? Please check ASSIGNMENT.md in this repository for assignment requirements.

## ?? Project Setup & Usage
**How to install and run the project**

- Prerequisites: Node 18+, npm 9+
- Set environment variables (see below) in a `.env` file in `frontend/` when running locally.

Commands
- `npm install`
- `npm run dev` ? starts Vite dev server and uses the Vercel-style API route at `/api/parse-event` if you run `vercel dev` (optional)
- `npm run build` ? typecheck + production build
- `npm run preview` ? serve the production build locally

Environment variables
- `VITE_SUPABASE_URL` = your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
- `GEMINI_API_KEY` = Google AI Studio key (used by the `/api/parse-event` serverless function)

## ?? Deployed Web URL or APK file
https://naver-2025-uni-sync-dpon.vercel.app/

## ?? Demo Video
https://youtu.be/2N9m2l3isjc

## ?? Project Introduction

### a. Overview
UniSync is a simple, reliable “Student Life Dashboard” for Vietnamese university students. Instead of only tracking tasks, UniSync aggregates all time-bound items (classes, assignments, exams, work shifts, personal events) into one place with three focused views: Today, Week, and Deadlines. It emphasizes fast entry (AI Quick-Add in Vietnamese), clear time handling, and full CRUD with persistent storage.

### b. Key Features & Function Manual
- Full CRUD on Events
  - Create: "+" button in any view opens a modal. Enter title, category, date (default today), start time, optional end time, location, and description.
  - Edit/Delete: Click any event card in Today or Week or any deadline card to open the same modal.
- Persistent Storage (Supabase)
  - Events are stored in a Postgres table via Supabase. App reads only the current device’s events (temporary per-device user id) until auth is added.
- Three Views of the Same Data
  - Today Timeline: ordered list with time blocks, “Next up” widget, shows location when available.
  - Week Planner: 7-day grid; shows title, start–end time, and location underneath.
  - Deadline Tracker: groups assignment/exam items into This Week, Next Week, and Future; each shows due date and an urgency chip (Hôm nay / Ngày mai / N ngày n?a).
- Time/Date Handling
  - All times use local timezone (Asia/Ho_Chi_Minh). Week view and deadlines compute dates by local calendar day (no UTC shift).
  - End time is optional; if omitted the app saves +60 minutes by default.
- AI Quick-Add (Vietnamese)
  - Type “H?p nhóm AI ngày mai 2 gi? chi?u t?i thu vi?n” or “19/9 h?c kh?i s? kinh doanh t? 14h10 d?n 17h30 ? D7-202”.
  - The parser (Gemini 1.5 via Vercel serverless) returns strict JSON (title, category, start_ts, end_ts, location, description).
  - If the year is omitted in the prompt, UniSync assumes the current year to avoid 2024/2023 drift.
- Performance & UX
  - Instant refresh after add/update/delete via a lightweight event bus.
  - Sensible empty states and small components for fast loading.

How to use
- Today/Week: press "+" to add; click on any card to edit/delete.
- AI Quick-Add: press the green "+" (bottom bar), type in Vietnamese, confirm details, Save.
- Deadlines: shows only `assignment` and `exam` categories with urgency badges.

### c. Unique Features (What’s special about this app?)
- Natural Vietnamese input for scheduling (“chi?u nay”, “th? 3”, “19/9 … t? … d?n … ? …”).
- Default-year guard: when prompts miss the year, UniSync forces the current calendar year in the preview and on save.
- Location surfaced: Week view and Today view display the location line, and it pre-fills in the editor.
- Clean separation of concerns and a deploy-ready Vercel serverless route for AI.

### d. Technology Stack and Implementation Methods
- Frontend: React 19, TypeScript, Vite, Tailwind-style utility classes (via classnames and light UI primitives).
- State: simple React state + a tiny event bus for cross-view refresh.
- Backend APIs:
  - Supabase (Postgres) for events persistence.
  - Vercel Serverless function (`/api/parse-event`) for Gemini 1.5 Flash parsing.
- Time handling: native Date; local-day calculations to avoid UTC/ISO drift.
- Deployment: Vercel (static build + serverless API).

### e. Service Architecture & Database structure (when used)
- Client (Vite) ?? Vercel Serverless `/api/parse-event` (Gemini) ?? Google GenAI
- Client (Vite) ?? Supabase REST/JS SDK ?? Postgres

Events table (simplified)
- `id` uuid PK
- `user_id` uuid (temporary device id until auth)
- `title` text
- `category` enum: `class | assignment | exam | work | personal`
- `start_ts` timestamptz
- `end_ts` timestamptz
- `location` text
- `description` text
- `is_done` boolean (future use)
- `priority` int (optional)
- indexes on `(user_id, start_ts)`

## ?? Reflection

### a. If you had more time, what would you expand?
- Real authentication + proper RLS in Supabase.
- Drag-to-create and drag-to-resize in Week view with snap-to-grid.
- Recurrence rules for classes, ICS/Google Calendar import.
- Reminders/notifications and offline cache.
- More robust timezone and locale controls.

### b. If you integrate AI APIs more for your app, what would you do?
- Structured function-calling to reduce parsing ambiguity.
- Speech-to-text for voice quick-add (with punctuation and time normalization).
- Smart conflict detection and auto-scheduling proposals (“best free blocks this week”).
- Summaries: “What’s my next 3 hours?” or “What’s due this week?”

## ? Checklist
- [x] Code runs without errors
- [x] All required features implemented (create/edit/delete tasks)
- [x] All ?? sections are filled
# Attendance Tracker (MERN)

Track your own attendance per subject on a calendar, and see exactly where you stand against your college's minimum (default 50%, adjustable per subject).

**Phase 1 (this version):** students mark their own days as present, absent or holiday.
**Phase 2 (planned):** teacher accounts post official attendance, students compare it with their own marks.

## What it does

- Register / log in (JWT + bcrypt)
- Add, edit and delete subjects, each with its own minimum attendance %
- Calendar per subject: tap a day to cycle present → absent → holiday → clear (future days are locked)
- Live stats: percentage, how many classes you can still miss, or how many you must attend in a row to get back above the line
- Holidays are excluded from the percentage; only present + absent count

## Stack

- **Frontend:** React 18, Vite, React Router, plain CSS
- **Backend:** Node, Express, Mongoose
- **Database:** MongoDB

## Run it locally

You need Node 18+ and a MongoDB database (a free MongoDB Atlas cluster is easiest).

```bash
# 1. Backend
cd server
cp .env.example .env        # then fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev                 # http://localhost:5000

# 2. Frontend (in a second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

In development the Vite dev server forwards `/api` to `localhost:5000`, so no extra config is needed.

Run the stats unit tests: `cd server && npm test`

## Project structure

```
server/
  index.js              app setup, DB connection
  models/               User, Subject, Attendance
  routes/               auth, subjects, attendance
  middleware/auth.js    JWT check (+ requireRole for phase 2)
  utils/stats.js        pure percentage / can-miss / must-attend maths
  test/stats.test.js
client/src/
  pages/                Login, Dashboard, SubjectPage
  components/           Calendar, SubjectCard, SubjectForm, Header
  api.js, AuthContext.jsx, stats.js
```

## API

All routes except register/login need `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | create account |
| POST | `/api/auth/login` | log in |
| GET | `/api/auth/me` | current user |
| GET | `/api/subjects` | your subjects, each with stats |
| POST | `/api/subjects` | add a subject |
| PUT | `/api/subjects/:id` | edit a subject |
| DELETE | `/api/subjects/:id` | delete a subject and its records |
| GET | `/api/attendance/:subjectId?month=2026-10` | records for one month |
| PUT | `/api/attendance` | `{ subjectId, date, status }` where status is `present`, `absent`, `holiday` or `none` (clears the day) |

## The maths

With `present` = P, `absent` = A, total = P + A and minimum = T%:

- Percentage = P / (P + A)
- Classes you can still miss = `floor((100·P − T·total) / T)`
- Classes you must attend in a row to recover = `ceil((T·total − 100·P) / (100 − T))`

Everything uses integer arithmetic, and the tests brute-force-check both formulas.

## Deploying on free tiers

Free-tier terms change, so check each provider's current limits.

1. **Database:** create a free cluster on MongoDB Atlas, add a database user, and copy the connection string. Render's free tier has no fixed IP, so Atlas network access usually has to allow `0.0.0.0/0`. Use a strong database password if you do this.
2. **Backend (Render):** new Web Service from your GitHub repo, root directory `server`, build command `npm install`, start command `npm start`. Add the environment variables `MONGODB_URI`, `JWT_SECRET` and `CLIENT_ORIGIN` (your Vercel URL, no trailing slash). The free service sleeps when idle, so the first request after a pause is slow. Open the app a minute before a demo.
3. **Frontend (Vercel or Netlify):** root directory `client`, framework Vite, and set `VITE_API_URL` to your Render URL (no trailing slash, no `/api`). `vercel.json` already contains the rewrite that makes page refreshes work.
4. Update `CLIENT_ORIGIN` on Render if the frontend URL changes.

## Phase 2 notes

Phase 1 was built so teacher features slot in without rewrites:

- `User.role` already exists (`student` | `teacher`); registration always creates students.
- `Attendance.source` already exists (`self` | `teacher`); the unique index includes it, so a self mark and a teacher mark for the same day can coexist and be compared.
- `requireRole('teacher')` middleware is ready for teacher-only routes.
- Stats are a pure function, so official records can reuse them as they are.

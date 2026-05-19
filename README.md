# 🏆 Who Wants to Be a Millionaire — Church Edition

A full-stack web game built for church communities. Hosts create questions with prize amounts, contestants join via a code, answer questions, use lifelines, and win prizes in ₦ (Nigerian Naira).

## ✨ Features

### 🎯 For Hosts
- **Create/Edit/Delete Questions** — Multiple choice with 4 options (A, B, C, D)
- **Set Prize Amounts** — Each question has its own ₦ prize value
- **Start Game Sessions** — Generates a unique join code for contestants
- **Track Sessions** — View active and completed games with results

### 🎮 For Contestants
- **Join by Code** — Enter the host's join code to start playing
- **Prize Ladder** — Each correct answer adds to your total winnings
- **3 Lifelines** per game:
  - **50:50** — Removes 2 wrong answers
  - **Phone a Friend** — A "friend" suggests an answer (75% accurate)
  - **Ask the Audience** — Shows audience poll percentages
- **Real-time Feedback** — See if you got it right immediately
- **Results Page** — View your final score and round-by-round breakdown

### 🔐 Authentication
- Email/password registration and login via Supabase Auth
- Role-based access (Host vs Contestant)
- Row Level Security — users can only access their own data

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Full-stack React framework |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui** | Accessible UI components |
| **Supabase** | Database, Authentication, RLS |
| **Vercel** | Deployment & hosting |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ (recommended)
- A Supabase account (free tier works)
- A Vercel account (for deployment)

### 1. Clone & Install

```bash
git clone https://github.com/praise-cloud/millionaire-church.git
cd millionaire-church
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **SQL Editor**
3. Open `schema.sql` from this project, copy the contents
4. Paste into a new query and click **Run**
5. Go to **Authentication → Settings** and ensure **Email** auth provider is enabled
6. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**

### 3. Configure Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📖 How to Use

### As a Host

1. Click **Get Started** → Select **Host** → Register
2. Go to **Manage Questions** → Click **Add Question**
3. Enter question text, 4 options (select the correct one with the radio button)
4. Set a prize amount in ₦ (e.g., ₦1,000 for Q1, ₦5,000 for Q2...)
5. Click **Create Question** — repeat for as many questions as you want
6. From Dashboard, click **Create New Session** — a join code appears (e.g., `ABC123`)
7. Share the join code with your contestant

### As a Contestant

1. Click **Get Started** → Select **Contestant** → Register
2. In the lobby, enter the host's join code and click **Join Game**
3. The game starts immediately
4. Read the question and click your answer
5. Use lifelines before answering if you're stuck:
   - **50:50** — eliminates 2 wrong options
   - **Phone** — friend calls with a suggestion
   - **Audience** — poll shows audience percentages
6. Correct answer = prize added to your total
7. Wrong answer = game over (keep what you've won so far)
8. After all questions, see your final results

---

## 🗄 Database Schema

The database uses Supabase PostgreSQL with Row Level Security:

```
profiles          — extends auth.users (id, email, full_name, role)
questions         — host-created questions with 4 options & prize
game_sessions     — game instances (host, contestant, status, join_code)
game_rounds       — each answer attempt (question, answer, correct, prize)
session_questions — links questions to sessions with ordering
```

Full schema with RLS policies in [`schema.sql`](./schema.sql).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/                     # Login & Register
│   │   └── callback/             # OAuth callback handler
│   ├── contestant/
│   │   ├── lobby/                # Join game by code
│   │   └── play/[sessionId]/     # Active game (questions, lifelines)
│   ├── host/
│   │   ├── dashboard/            # Sessions overview
│   │   └── questions/            # CRUD questions
│   ├── results/[sessionId]/      # Game results
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles + shadcn theme
├── components/
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── utils.ts                  # cn() helper
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       ├── server.ts             # Server Supabase client
│       └── middleware.ts         # Session cookie management
└── proxy.ts                     # Edge middleware (auth refresh)
```

---

## 🌐 Deployment

### One-Click Vercel Deploy

1. Push to GitHub (done ✅ — https://github.com/praise-cloud/millionaire-church)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the `millionaire-church` repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

Your app will be live at `https://millionaire-church.vercel.app`

---

## 🔧 Common Issues

**"Failed to load SWC binary"**
→ Switch to Node.js 22+ (not Node 26): `nvm use 22`

**"useSearchParams() should be wrapped in a Suspense boundary"**
→ Already handled — the auth page wraps the form in `<Suspense>`

**Login not working**
→ Ensure email/password auth is enabled in Supabase Auth settings
→ Check that `.env.local` has the correct Supabase URL and anon key

---

## 📄 License

Built for church ministry use. Free to use and modify.

---

## 🙏 Support

For questions or feature requests, open an issue on GitHub or reach out to your church tech team.

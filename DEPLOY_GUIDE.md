# Deployment Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click **New project**
3. Name it `millionaire-church`
4. Set a database password (save it securely)
5. Choose a region close to you
6. Click **Create new project** (takes ~2 minutes)

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Open `schema.sql` from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** (all tables and security policies will be created)

## Step 3: Enable Auth

1. In Supabase dashboard, go to **Authentication > Settings**
2. Under **Auth providers**, ensure **Email** is enabled
3. Disable "Confirm email" if you want users to log in immediately (optional)

## Step 4: Get API Keys

1. In Supabase dashboard, go to **Project Settings > API**
2. Copy your **Project URL** and **anon public key**
3. Open `.env.local` in this project and paste them:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 5: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Create a GitHub repository for this project
2. Push the code:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USER/millionaire-church.git
   git push -u origin main
   ```
3. Go to https://vercel.com and click **Add New > Project**
4. Import your GitHub repository
5. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy**

### Option B: Vercel CLI

```bash
npx vercel
# Follow the prompts, set environment variables when asked
```

## Step 6: Test

1. Open your Vercel URL (e.g., `https://millionaire-church.vercel.app`)
2. Register as a **Host**
3. Create questions with prize amounts
4. Start a session (get the join code)
5. In another browser, register as a **Contestant**
6. Enter the join code and play!

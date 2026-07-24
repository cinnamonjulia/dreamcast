# Dreamcast ✦

A dreamy dashboard for keeping track of dreams, projects, and momentum — and propelling them forward. Everything floats in a cotton-candy sky, and an anime Julia fishes dream bubbles out of it.

## Running locally

It's a fully static site — no build step. Either:

- Open `index.html` directly in Chrome or Safari, **or**
- Serve it (nicer for module loading): `python3 -m http.server 8000` in this folder, then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g. `dreamcast`) and push this folder to the `main` branch:
   ```sh
   git init
   git add .
   git commit -m "Dreamcast"
   git branch -M main
   git remote add origin https://github.com/<your-username>/dreamcast.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", pick branch **`main`** and folder **`/ (root)`**, then Save.
4. After a minute, the site is live at `https://<your-username>.github.io/dreamcast/`.

## Your data

- Everything is saved automatically to your browser's `localStorage` (key `dreamcast.v1`). It never leaves your machine unless you enable sync.
- **Back it up**: Settings (gear icon) → *Export my dreams* downloads a `dreamcast-backup-YYYY-MM-DD.json`. *Import…* restores from one. Do this occasionally — localStorage is per-browser.

## Sync across devices (Supabase, optional)

One-time setup, ~5 minutes, free tier is plenty:

1. Create a project at [supabase.com](https://supabase.com) (any name, any region).
2. In the project: **SQL Editor** → paste and run:
   ```sql
   create table if not exists public.dreamcast_state (
     user_id uuid primary key references auth.users(id) on delete cascade,
     data jsonb not null,
     updated_at timestamptz not null default now()
   );
   alter table public.dreamcast_state enable row level security;
   create policy "own state" on public.dreamcast_state
     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
   ```
3. In **Settings → API**, copy the **Project URL** and the **anon public** key, and paste them into the two constants at the top of `js/sync.js`. (The anon key is meant to be public — your data is protected by the row-level security policy above, which only lets you read/write your own row.)
4. Redeploy (commit + push). Then on any device: Settings → **Sync devices ✦** → enter your email → type the 6-digit code from your inbox. Dreams merge automatically across devices — for each dream, the most recently touched version wins.

## Around the sky

- **The Horizon** (top) — someday dreams drifting near the sun. Click one to start chasing it.
- **Today & This Week tray** — quick goals; check one off and Julia catches it into the Bubble Jar.
- **The sky** — your active mid/long dreams as floating cloud cards. Hover one and Julia casts her line at it. Click to open milestones, notes, and the update timeline.
- **Bubble Jar** (header) — every catch collects here; click it for the Caught Dreams gallery.
- The sky gets sparklier the more you do each week. ✦

Sound is synthesized in-browser (soft chimes only) — mute with the bell icon.

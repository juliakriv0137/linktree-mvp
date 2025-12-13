# Link Page MVP (Linktree-like)

A minimal Linktree-style app:
- Public page: `/{username}`
- Dashboard to edit profile + add/reorder/hide links
- Click tracking via `/api/click` → `click_events` table

## 1) Prerequisites
- Node.js 20+ recommended
- A Supabase project

## 2) Create Supabase project
1. Create a project in Supabase.
2. Go to **Settings → API** and copy:
   - **Project URL**
   - **anon public key**
3. Go to **SQL Editor** and run the file `supabase.sql` (copy/paste).

## 3) Configure Auth
In Supabase:
- **Authentication → URL Configuration**
  - Site URL: `http://localhost:3000` (for local dev)
  - Redirect URLs: add `http://localhost:3000/**`

For production (Vercel), set:
- Site URL: `https://YOUR_DOMAIN`
- Redirect URLs: add `https://YOUR_DOMAIN/**`

## 4) Local setup
```bash
npm install
cp env.example .env.local
```

Edit `.env.local`:
- `SUPABASE_URL` = your project URL
- `SUPABASE_ANON_KEY` = your anon key
- `NEXT_PUBLIC_SITE_URL` = `http://localhost:3000`

Run:
```bash
npm run dev
```

Open:
- Home: http://localhost:3000
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
- Public page: http://localhost:3000/your_username

## 5) Production deploy (Vercel)
1. Push the project to GitHub
2. Import into Vercel
3. Add env vars in Vercel project settings:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://YOUR_DOMAIN`
4. Update Supabase Auth URL configuration to match your domain
5. Deploy

## Notes
- Username rules: 3–24 chars, lowercase a-z, 0-9, underscore.
- If a user logs in the first time, the dashboard auto-creates a profile with username `userXXXXXXXX`.

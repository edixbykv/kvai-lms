# Deployment Guide — KVAI LMS

This guide covers deploying KVAI LMS to **Vercel** with a managed PostgreSQL database and connecting the `learn.kvai.in` domain.

## 1. Prerequisites
- A GitHub account (to host the repo)
- A Vercel account
- A PostgreSQL database (recommended: **Neon** or **Prisma Postgres** via the Vercel Marketplace)

## 2. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: KVAI LMS"
git branch -M main
git remote add origin https://github.com/<you>/kvai-lms.git
git push -u origin main
```

## 3. Provision a database
**Option A — Vercel Marketplace (recommended):** In the Vercel project → Storage → add **Neon Postgres**. This auto-injects `DATABASE_URL`.

**Option B — Bring your own:** Create a Postgres DB anywhere and copy its connection string (must allow SSL).

## 4. Import to Vercel
1. Vercel → **Add New → Project** → import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected).
3. Build command is already configured in `vercel.json`:
   `prisma generate && prisma migrate deploy && next build`

## 5. Environment variables
Add these in **Project → Settings → Environment Variables**:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `JWT_SECRET` | ✅ | Long random string |
| `NEXT_PUBLIC_APP_URL` | ✅ | e.g. `https://learn.kvai.in` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | optional | Google login |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` | optional | Live payments |
| `CLOUDINARY_*` | optional | Media uploads |
| `SMTP_*` | optional | Transactional email |

## 6. Seed production data (once)
After the first deploy, run the seed against the production DB locally:
```bash
DATABASE_URL="<prod-url>" npm run db:seed
```
Then **change the seeded admin password** immediately.

## 7. Connect the domain
Vercel → Project → **Domains** → add `learn.kvai.in`. Add the DNS records Vercel shows (usually a `CNAME` to `cname.vercel-dns.com`) at your DNS provider.

## 8. Post-deploy checklist
- [ ] Sign in as Super Admin and change the password
- [ ] Update Settings → site name, support email
- [ ] Add real `RAZORPAY_*` keys for live payments
- [ ] Configure Google OAuth redirect URI to the production callback
- [ ] Set the Razorpay webhook (optional) to `/api/payments/verify`

## Notes
- Migrations run automatically on every deploy via `prisma migrate deploy`.
- The Prisma client is regenerated on install (`postinstall`) so `src/generated` need not be committed.
- Region is set to `bom1` (Mumbai) in `vercel.json` for India-first latency; adjust as needed.

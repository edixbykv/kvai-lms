# KVAI LMS — Production Online Education Platform

A complete, commercial-grade **Online Education SaaS Platform** for **learn.kvai.in**, built by KVAI Solutions. Designed for students, training institutes, skill councils, coaching centres and corporate training organisations.

This is a real, deployable product — not a demo or prototype. It ships with authentication, RBAC, a full course/learning system, quizzes & exams, verifiable certificates, payments, marketing tools, analytics dashboards, audit logging and a complete admin panel.

## 🌐 Live

| | |
|---|---|
| **Live site** | https://learn.kvai.in (also https://kvai-lms.vercel.app) |
| **Hosting** | Vercel (project `kvai-lms`, auto-deploys on push to `main`) |
| **Database** | **Neon Postgres** (serverless, pooled — provisioned via Vercel Marketplace) |
| **Repo** | https://github.com/edixbykv/kvai-lms |

**Demo logins:** `admin@kvai.in / Admin@123` (super admin) · `student@kvai.in / Student@123`

> Catalogue currently holds **test/dummy courses** across Technology (Web Dev, Python, Data Science, Cloud/DevOps, Cyber Security) and Government job prep (SSC, Banking, Railway, UPSC, Teaching). Payment/Google/email/storage integrations run in safe fallback mode until real keys are added by the buyer.

---

## ✨ Features

### For Students
- Registration, login, email verification, forgot/reset password, **Google OAuth**, optional **2FA**
- Student dashboard with **professional charts & analytics** (progress, quiz performance, streak, weekly activity)
- Course catalogue with search, categories and price filters
- **Course player**: video lessons (YouTube unlisted/embed), PDFs, text lessons, resume playback, progress & completion tracking, notes & bookmarks
- **Quizzes & exams**: MCQ, multiple-choice, true/false, timed, randomised, auto-grading with answer review
- **Auto-issued, verifiable certificates** with unique IDs, QR codes and a public verification page; PDF download
- Digital library, notifications, orders & invoices, profile & security (device/session tracking, login history)

### For Admins / Staff (7 roles)
- **Analytics dashboard**: students, revenue, enrolments, completion rate, popular courses, certificates, payment analytics
- **Course manager** with a curriculum builder (sections & lessons)
- **Student management** (view, edit, suspend)
- **Custom Role Builder + RBAC**: create / edit / clone roles, toggle granular permissions
- **Finance**: payments, refund workflow, invoices, reports
- **Certificates**: generate, reissue, revoke, verify
- **Marketing**: coupons, leads, referral & affiliate models
- **Content / CMS**: blog, FAQ, pages, success stories
- **Team & multi-admin**: invite admins, last-login tracking
- **Audit logs** across login, course, role, certificate, student and payment actions
- **Settings** with integration status

### Public Website
Home, Courses, Course detail, About, Contact, Blog, FAQ, Privacy, Terms, Certificate verification, Success stories.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** + **TypeScript** |
| Styling | **Tailwind CSS v4** + custom shadcn-style UI components |
| Backend | Next.js Route Handlers (REST APIs) |
| Database | **Neon Postgres** (serverless, pooled) + **Prisma 7** (pg driver adapter) |
| Auth | **JWT** (jose, httpOnly cookies) + **Google OAuth** + bcrypt |
| Charts | Recharts |
| Payments | **Razorpay** (with simulated fallback) |
| Storage | **Cloudinary** |
| Email | Nodemailer (SMTP) |
| Certificates | pdf-lib + QR codes |
| Deployment | **Vercel** |

> Architecture note: rather than a separate Express server, the backend is implemented as Next.js Route Handlers — the Vercel-native approach that deploys as serverless functions with zero extra infrastructure, while keeping clean REST semantics, validation (Zod), auth guards and RBAC.

---

## 🚀 Getting Started

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET (minimum). Other integrations are optional.
```

### 3. Set up the database
```bash
npx prisma migrate deploy   # apply migrations
npm run db:seed             # seed roles, permissions, demo data
```

### 4. Run
```bash
npm run dev
# http://localhost:3000
```

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@kvai.in` | `Admin@123` |
| Instructor (Course Manager) | `instructor@kvai.in` | `Admin@123` |
| Student | `student@kvai.in` | `Student@123` |

---

## 🔐 Roles & Permissions

Seven system roles ship out of the box: **Super Admin, Admin, Course Manager, Content Manager, Finance Manager, Support Executive, Student**. The Super Admin can build unlimited custom roles and toggle any of 25+ granular permissions (course, students, certificates, finance, content, website, administration).

---

## 💳 Payments

Razorpay is fully integrated (orders → checkout → signature verification → enrolment → invoice → refunds). **If Razorpay keys are not set, paid checkout runs in a safe simulated mode** so the platform is fully usable before credentials are added — just add `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to go live.

---

## 📦 Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add a **Postgres** database (Neon / Supabase / Prisma Postgres via the Marketplace) and set `DATABASE_URL`.
4. Add `JWT_SECRET`, `NEXT_PUBLIC_APP_URL` and any optional integration keys.
5. Deploy. The build runs `prisma generate && prisma migrate deploy && next build`.
6. Point the custom domain `learn.kvai.in` to the project.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full guide.

---

## 📁 Project Structure

```
prisma/                 # Schema, migrations, seed
src/
  app/
    (marketing)/        # Public website
    (auth)/             # Auth pages
    (dashboard)/        # Student dashboard
    admin/              # Admin panel
    learn/[slug]/       # Course player
    quiz/[id]/          # Quiz runner
    api/                # REST API route handlers
  components/
    ui/                 # Design-system primitives
    site/ shared/ dashboard/ admin/ learn/ quiz/ charts/
  lib/                  # prisma, auth, rbac, session, api, razorpay, cloudinary, email, certificate…
```

---

## 📄 License

© KVAI Solutions. All rights reserved.

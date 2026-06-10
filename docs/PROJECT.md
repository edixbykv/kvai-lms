# KVAI LMS — Project Guide & Feature Reference

> A single document anyone can read to understand **what this project is, how it's built, and every feature it has.** Keep this updated as the project evolves.

## 1. What is this?

**KVAI LMS** is a production-grade **Online Education SaaS platform** for `learn.kvai.in` (by KVAI Solutions). It sells and delivers online courses with two focus areas:

- **Technology courses** — Web Development, Programming, Data Science & AI, Cloud/DevOps, Cyber Security
- **Government job preparation** — SSC, Banking, Railway (RRB), UPSC, Teaching (CTET/TET)

It is a real, sellable product (a white-label LMS): a buyer plugs in their own database, payment, email and OAuth credentials and runs their own academy.

## 2. Who uses it (roles)

| Role | Can do |
|---|---|
| **Super Admin** | Everything, incl. building custom roles |
| **Admin** | Manage platform (except roles/admins) |
| **Course Manager** | Create/edit/publish courses & content |
| **Content Manager** | Content, quizzes, blog, FAQ |
| **Finance Manager** | Payments, refunds, reports |
| **Support Executive** | View/edit students, verify/reissue certificates |
| **Student** | Learn, take quizzes, earn certificates |

Permissions are **fully granular (25+)** and can be toggled per role. Super Admin can create/clone/edit custom roles.

## 3. Tech stack

- **Next.js 16 (App Router)** + React 19 + TypeScript
- **Tailwind CSS v4** + custom shadcn-style component library (white + classic green theme)
- **PostgreSQL + Prisma 7** (driver adapter) — 37 models
- **JWT** auth (jose, httpOnly cookies) + **Google OAuth** + bcrypt + optional 2FA
- **Recharts** for analytics
- **Razorpay** payments (with simulated fallback when keys absent)
- **Cloudinary** storage, **Nodemailer** email, **pdf-lib + qrcode** certificates
- Deployed on **Vercel**

> Backend = Next.js Route Handlers (REST). No separate Express server — this is the Vercel-native, zero-infra approach with the same REST semantics, Zod validation, auth guards and RBAC.

## 4. Feature map

### Authentication & Security
Register · Login · Email verification · Forgot/Reset password · Google OAuth · 2FA toggle · Session & device tracking · Login history · Audit logs · Suspend/activate accounts.

### Public website
Home (hero, stats, categories, featured courses, testimonials, CTA) · Courses (search + category + price filters) · Course detail (curriculum, reviews, enroll/buy) · Blog + post · FAQ · Contact (lead capture) · About · Privacy · Terms · Certificate verification · Success stories.

### Student experience
Dashboard (charts: progress, quiz performance, weekly activity, category split, streak, recent activity) · My courses · **Course player** (video/PDF/text, resume, progress, mark complete, notes, bookmarks, quiz links) · Quizzes (timed, randomised, auto-graded, answer review) · Certificates (PDF + QR + verify) · Digital library · Notifications · Orders & invoices · Profile & security.

### Admin panel
Analytics dashboard (students, revenue, enrolments, completion rate, popular courses, certificates, payments, 6-month trends) · Course manager + **curriculum builder** (sections/lessons) · Students (suspend) · **Roles & permissions builder** · Finance (payments + refunds) · Certificates (generate/revoke/reissue) · Marketing (coupons + leads) · Content/CMS · Team & admin invites · Audit logs · Settings + integration status.

### Commerce
Razorpay order → checkout → signature verify → enrol → invoice · Coupons (percent/flat) · Refund workflow (revokes access) · Referral & affiliate models in schema.

### Certificates
Auto-issued on course completion · Unique ID (`KVAI-YYYY-XXXX`) · QR code · Public verification page · Downloadable PDF · Reissue & revoke.

## 5. Project structure

```
prisma/                  schema.prisma · migrations · seed.ts
src/app/
  (marketing)/           public website
  (auth)/                login/register/forgot/reset/verify
  (dashboard)/           student dashboard
  admin/                 admin panel
  learn/[slug]/          course player
  quiz/[id]/             quiz runner
  api/                   REST route handlers (auth, payments, admin, …)
src/components/
  ui/                    design-system primitives (button, card, dialog, …)
  site/ shared/ dashboard/ admin/ learn/ quiz/ charts/
src/lib/                 prisma · auth · rbac · session · api · razorpay ·
                         cloudinary · email · certificate · audit · validations
docs/                    PROJECT.md · DEPLOYMENT.md · API.md
```

## 6. Demo accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@kvai.in | Admin@123 |
| Instructor | instructor@kvai.in | Admin@123 |
| Student | student@kvai.in | Student@123 |

## 7. Local development

```bash
npm install
cp .env.example .env      # set DATABASE_URL + JWT_SECRET
npx prisma migrate deploy
npm run db:seed
npm run dev               # http://localhost:3000
```

## 8. Going live (summary)

1. Push to GitHub.
2. Import to Vercel, add a Postgres DB, set `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`.
3. (Optional) add Razorpay / Google / Cloudinary / SMTP keys.
4. Connect `learn.kvai.in`.

Full steps in `docs/DEPLOYMENT.md`. API reference in `docs/API.md`.

## 9. Selling / white-labelling notes

The platform currently ships with **test/dummy data** and placeholder integration keys. A buyer should:
- Replace seeded courses with their own content.
- Add their own Razorpay, Google OAuth, Cloudinary and SMTP credentials.
- Change the seeded admin password and `JWT_SECRET`.
- Update branding in Settings and `src/components/shared/logo.tsx`.

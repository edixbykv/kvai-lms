# API Reference — KVAI LMS

All endpoints are Next.js Route Handlers under `/api`. Responses follow:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "…", "errors": { ... } }
```
Auth uses an httpOnly JWT cookie (`kvai_token`) set on login/register. Protected routes return `401` when unauthenticated and `403` when lacking the required permission.

## Auth
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | name, email, password, referralCode? | Create account + session |
| POST | `/api/auth/login` | email, password, code? | Login (2FA via `code`) |
| POST | `/api/auth/logout` | — | Revoke session |
| GET | `/api/auth/me` | — | Current user |
| POST | `/api/auth/verify-email` | token | Verify email |
| POST | `/api/auth/forgot-password` | email | Send reset link |
| POST | `/api/auth/reset-password` | token, password | Reset password |
| GET | `/api/auth/google` | — | Start Google OAuth |
| GET | `/api/auth/google/callback` | code | OAuth callback |

## Learning
| Method | Path | Description |
|---|---|---|
| POST | `/api/enroll` | Enrol in a free course |
| POST | `/api/progress` | Save lesson progress; auto-issues certificate on completion |
| GET/POST | `/api/notes` | List / create notes |
| DELETE | `/api/notes/:id` | Delete a note |
| POST | `/api/bookmarks` | Toggle a bookmark |
| POST | `/api/quizzes/:id/submit` | Submit & auto-grade a quiz |

## Payments
| Method | Path | Description |
|---|---|---|
| POST | `/api/payments/create-order` | Create order (Razorpay or simulated) |
| POST | `/api/payments/verify` | Verify signature → enrol → invoice |

## Profile
| Method | Path | Description |
|---|---|---|
| PATCH | `/api/profile` | Update profile |
| POST | `/api/profile/password` | Change password |
| POST | `/api/profile/2fa` | Toggle 2FA |
| POST | `/api/notifications/read-all` | Mark all read |

## Admin (permission-guarded)
| Method | Path | Permission | Description |
|---|---|---|---|
| GET/POST | `/api/admin/courses` | course.edit / course.create | List / create courses |
| PATCH/DELETE | `/api/admin/courses/:id` | course.edit / course.delete | Update / delete course |
| POST | `/api/admin/sections` | course.edit | Add section |
| DELETE | `/api/admin/sections/:id` | course.edit | Delete section |
| POST | `/api/admin/lessons` | course.edit | Add lesson |
| DELETE | `/api/admin/lessons/:id` | course.edit | Delete lesson |
| PATCH | `/api/admin/students/:id` | student.suspend | Suspend / activate |
| GET/POST | `/api/admin/roles` | admin.roles | List / create roles |
| PATCH/DELETE | `/api/admin/roles/:id` | admin.roles | Update / delete role |
| POST | `/api/admin/roles/:id/clone` | admin.roles | Clone role |
| POST | `/api/admin/certificates` | certificate.generate | Issue certificate |
| PATCH | `/api/admin/certificates/:id` | certificate.* | Revoke / reissue |
| POST | `/api/admin/refunds` | finance.refunds | Process refund |
| POST | `/api/admin/coupons` | course.edit | Create coupon |
| POST | `/api/admin/team` | admin.users | Invite team member |
| POST | `/api/admin/settings` | admin.settings | Save settings |

## Public
| Method | Path | Description |
|---|---|---|
| POST | `/api/leads` | Capture a contact/lead |
| GET | `/api/certificates/:id/download` | Certificate PDF (owner/staff) |
| GET | `/api/library/:id/download` | Library item download |

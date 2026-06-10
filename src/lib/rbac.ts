// ============================================================
// RBAC — Permission catalog & system roles
// ============================================================

export interface PermissionDef {
  key: string;
  group: string;
  label: string;
}

export const PERMISSIONS: PermissionDef[] = [
  // Course
  { key: "course.create", group: "Course", label: "Create courses" },
  { key: "course.edit", group: "Course", label: "Edit courses" },
  { key: "course.delete", group: "Course", label: "Delete courses" },
  { key: "course.publish", group: "Course", label: "Publish courses" },

  // Students
  { key: "student.view", group: "Students", label: "View students" },
  { key: "student.edit", group: "Students", label: "Edit students" },
  { key: "student.suspend", group: "Students", label: "Suspend students" },

  // Certificates
  { key: "certificate.generate", group: "Certificates", label: "Generate certificates" },
  { key: "certificate.reissue", group: "Certificates", label: "Reissue certificates" },
  { key: "certificate.verify", group: "Certificates", label: "Verify certificates" },

  // Finance
  { key: "finance.payments", group: "Finance", label: "View payments" },
  { key: "finance.refunds", group: "Finance", label: "Process refunds" },
  { key: "finance.reports", group: "Finance", label: "View financial reports" },

  // Content
  { key: "content.videos", group: "Content", label: "Manage videos" },
  { key: "content.pdfs", group: "Content", label: "Manage PDFs" },
  { key: "content.assignments", group: "Content", label: "Manage assignments" },
  { key: "content.quizzes", group: "Content", label: "Manage quizzes" },

  // Website
  { key: "website.homepage", group: "Website", label: "Manage homepage" },
  { key: "website.seo", group: "Website", label: "Manage SEO" },
  { key: "website.blog", group: "Website", label: "Manage blog" },
  { key: "website.faq", group: "Website", label: "Manage FAQ" },

  // Administration
  { key: "admin.roles", group: "Administration", label: "Manage roles & permissions" },
  { key: "admin.logs", group: "Administration", label: "View audit logs" },
  { key: "admin.settings", group: "Administration", label: "Manage settings" },
  { key: "admin.users", group: "Administration", label: "Manage admins" },
];

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

// System roles and their default permission sets
export interface SystemRoleDef {
  name: string;
  slug: string;
  description: string;
  permissions: string[] | "*"; // "*" = all
}

export const SYSTEM_ROLES: SystemRoleDef[] = [
  {
    name: "Super Admin",
    slug: "super-admin",
    description: "Full unrestricted access to the entire platform.",
    permissions: "*",
  },
  {
    name: "Admin",
    slug: "admin",
    description: "Manage most of the platform except critical role/security settings.",
    permissions: ALL_PERMISSION_KEYS.filter(
      (k) => k !== "admin.roles" && k !== "admin.users"
    ),
  },
  {
    name: "Course Manager",
    slug: "course-manager",
    description: "Create, edit, publish courses and manage related content.",
    permissions: [
      "course.create",
      "course.edit",
      "course.delete",
      "course.publish",
      "content.videos",
      "content.pdfs",
      "content.assignments",
      "content.quizzes",
      "student.view",
    ],
  },
  {
    name: "Content Manager",
    slug: "content-manager",
    description: "Manage learning content, videos, PDFs, quizzes and the blog.",
    permissions: [
      "content.videos",
      "content.pdfs",
      "content.assignments",
      "content.quizzes",
      "website.blog",
      "website.faq",
      "course.edit",
    ],
  },
  {
    name: "Finance Manager",
    slug: "finance-manager",
    description: "Manage payments, refunds and financial reports.",
    permissions: ["finance.payments", "finance.refunds", "finance.reports", "student.view"],
  },
  {
    name: "Support Executive",
    slug: "support-executive",
    description: "Assist students; view records and certificates.",
    permissions: ["student.view", "student.edit", "certificate.verify", "certificate.reissue"],
  },
  {
    name: "Student",
    slug: "student",
    description: "Default learner role.",
    permissions: [],
  },
];

export function resolvePermissions(role: SystemRoleDef): string[] {
  return role.permissions === "*" ? ALL_PERMISSION_KEYS : role.permissions;
}

export function hasPermission(
  userPermissions: string[] | undefined | null,
  required: string
): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes("*") || userPermissions.includes(required);
}

// Roles considered "staff" (can access /admin)
export const STAFF_ROLE_SLUGS = [
  "super-admin",
  "admin",
  "course-manager",
  "content-manager",
  "finance-manager",
  "support-executive",
];

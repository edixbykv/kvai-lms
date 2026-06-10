import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasPermission, STAFF_ROLE_SLUGS } from "@/lib/rbac";
import { DashboardShell, NavGroup, NavItem } from "@/components/dashboard/dashboard-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin");
  if (!user.roleSlug || !STAFF_ROLE_SLUGS.includes(user.roleSlug)) redirect("/dashboard");

  const can = (p: string) => hasPermission(user.permissions, p);

  const mainItems: NavItem[] = [{ href: "/admin", label: "Dashboard", icon: "LayoutDashboard" }];

  const manageItems: NavItem[] = [];
  if (can("course.create") || can("course.edit")) manageItems.push({ href: "/admin/courses", label: "Courses", icon: "BookOpen" });
  if (can("content.quizzes")) manageItems.push({ href: "/admin/quizzes", label: "Quizzes", icon: "FileQuestion" });
  if (can("student.view")) manageItems.push({ href: "/admin/students", label: "Students", icon: "Users" });
  if (can("certificate.generate")) manageItems.push({ href: "/admin/certificates", label: "Certificates", icon: "Award" });

  const bizItems: NavItem[] = [];
  if (can("finance.payments")) bizItems.push({ href: "/admin/finance", label: "Finance", icon: "IndianRupee" });
  if (can("website.blog") || can("website.faq")) bizItems.push({ href: "/admin/content", label: "Content / CMS", icon: "FileText" });
  if (can("course.edit")) bizItems.push({ href: "/admin/marketing", label: "Marketing", icon: "Megaphone" });

  const adminItems: NavItem[] = [];
  if (can("admin.users")) adminItems.push({ href: "/admin/team", label: "Team & Admins", icon: "UserCog" });
  if (can("admin.roles")) adminItems.push({ href: "/admin/roles", label: "Roles & Permissions", icon: "ShieldCheck" });
  if (can("admin.logs")) adminItems.push({ href: "/admin/audit-logs", label: "Audit Logs", icon: "ScrollText" });
  if (can("admin.settings")) adminItems.push({ href: "/admin/settings", label: "Settings", icon: "Settings" });

  const nav: NavGroup[] = [
    { items: mainItems },
    ...(manageItems.length ? [{ title: "Manage", items: manageItems }] : []),
    ...(bizItems.length ? [{ title: "Business", items: bizItems }] : []),
    ...(adminItems.length ? [{ title: "Administration", items: adminItems }] : []),
  ];

  const notifCount = await prisma.notification.count({ where: { userId: user.id, read: false } });

  return (
    <DashboardShell
      nav={nav}
      user={{ name: user.name, email: user.email, image: user.image }}
      title="Admin Panel"
      notifCount={notifCount}
    >
      {children}
    </DashboardShell>
  );
}

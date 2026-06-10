import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell, NavGroup } from "@/components/dashboard/dashboard-shell";

const nav: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" },
      { href: "/dashboard/my-courses", label: "My Courses", icon: "BookOpen" },
      { href: "/dashboard/certificates", label: "Certificates", icon: "Award" },
    ],
  },
  {
    title: "Learning",
    items: [
      { href: "/dashboard/notes", label: "Notes", icon: "StickyNote" },
      { href: "/dashboard/bookmarks", label: "Bookmarks", icon: "Bookmark" },
      { href: "/dashboard/library", label: "Digital Library", icon: "Library" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/dashboard/notifications", label: "Notifications", icon: "Bell" },
      { href: "/dashboard/orders", label: "Orders & Invoices", icon: "Receipt" },
      { href: "/dashboard/profile", label: "Profile & Security", icon: "Settings" },
    ],
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const notifCount = await prisma.notification.count({ where: { userId: user.id, read: false } });

  return (
    <DashboardShell
      nav={nav}
      user={{ name: user.name, email: user.email, image: user.image }}
      title="Dashboard"
      notifCount={notifCount}
    >
      {children}
    </DashboardShell>
  );
}

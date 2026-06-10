import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { AreaTrend, BarSeries, DonutChart } from "@/components/charts/charts";
import { Users, GraduationCap, IndianRupee, Award, BookOpen, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function AdminDashboard() {
  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalStudents, totalCourses, totalCerts, newRegs,
    paidOrders, enrollments, allUsers, popularCourses, recentPayments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { slug: "student" } } }),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.certificate.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyAgo } } }),
    prisma.order.findMany({ where: { status: "PAID" }, select: { total: true, createdAt: true } }),
    prisma.enrollment.findMany({ select: { enrolledAt: true, status: true, progress: true } }),
    prisma.user.findMany({ select: { createdAt: true } }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: "desc" } },
      take: 5,
    }),
    prisma.payment.findMany({ where: { status: "CAPTURED" }, include: { order: { include: { user: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const totalRevenue = paidOrders.reduce((a, o) => a + Number(o.total), 0);
  const activeStudents = enrollments.filter((e) => e.status === "ACTIVE").length;
  const completionRate = enrollments.length
    ? Math.round((enrollments.filter((e) => e.status === "COMPLETED").length / enrollments.length) * 100)
    : 0;

  // Build 6-month series
  const months: { label: string; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: MONTHS[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth()}` });
  }
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

  const revenueSeries = months.map((m) => ({
    month: m.label,
    revenue: paidOrders.filter((o) => monthKey(o.createdAt) === m.key).reduce((a, o) => a + Number(o.total), 0),
  }));
  const enrollSeries = months.map((m) => ({
    month: m.label,
    enrollments: enrollments.filter((e) => monthKey(e.enrolledAt) === m.key).length,
  }));
  const regSeries = months.map((m) => ({
    month: m.label,
    users: allUsers.filter((u) => monthKey(u.createdAt) === m.key).length,
  }));

  const courseData = popularCourses.map((c) => ({ name: c.title.length > 18 ? c.title.slice(0, 16) + "…" : c.title, value: c._count.enrollments }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Overview</h2>
        <p className="text-muted-foreground">Key metrics across KVAI LMS.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={totalStudents} icon={Users} accent="primary" trend={12} />
        <StatCard label="Active Learners" value={activeStudents} icon={GraduationCap} accent="blue" trend={8} />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={IndianRupee} accent="violet" trend={23} />
        <StatCard label="Certificates Issued" value={totalCerts} icon={Award} accent="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Published Courses" value={totalCourses} icon={BookOpen} accent="primary" />
        <StatCard label="New Registrations (30d)" value={newRegs} icon={TrendingUp} accent="blue" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={GraduationCap} accent="violet" hint="Across all enrollments" />
        <StatCard label="Total Enrollments" value={enrollments.length} icon={Users} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue (6 months)</CardTitle></CardHeader>
          <CardContent><AreaTrend data={revenueSeries} dataKey="revenue" xKey="month" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Enrollment trend</CardTitle></CardHeader>
          <CardContent><BarSeries data={enrollSeries} dataKey="enrollments" xKey="month" color="#2563eb" /></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>New registrations</CardTitle></CardHeader>
          <CardContent><AreaTrend data={regSeries} dataKey="users" xKey="month" color="#7c3aed" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Popular courses</CardTitle></CardHeader>
          <CardContent>
            {courseData.length ? <DonutChart data={courseData} height={240} /> : <p className="py-16 text-center text-sm text-muted-foreground">No data</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent payments</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentPayments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
          ) : recentPayments.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
              <div>
                <p className="text-sm font-medium">{p.order.user.name}</p>
                <p className="text-xs text-muted-foreground">{p.method} · {p.order.user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrency(Number(p.amount))}</p>
                <Badge variant="success">{p.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

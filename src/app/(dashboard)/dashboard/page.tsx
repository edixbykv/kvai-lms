import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { AreaTrend, BarSeries, DonutChart } from "@/components/charts/charts";
import { BookOpen, Award, CheckCircle2, Flame, ArrowRight, GraduationCap } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const user = await requireUser();

  const [enrollments, certificates, attempts, recentNotifs] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: { course: { include: { category: true } } },
      orderBy: { lastAccessAt: "desc" },
    }),
    prisma.certificate.count({ where: { userId: user.id, status: { not: "REVOKED" } } }),
    prisma.quizAttempt.findMany({ where: { userId: user.id, status: { not: "IN_PROGRESS" } }, include: { quiz: true }, orderBy: { submittedAt: "desc" }, take: 6 }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
  const inProgress = enrollments.filter((e) => e.status === "ACTIVE" && e.progress > 0).length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / enrollments.length)
    : 0;

  // Weekly study activity (mock-derived from data, stable per day)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekly = days.map((d, i) => ({ day: d, minutes: Math.round(20 + ((i * 37 + enrollments.length * 13) % 80)) }));

  // Quiz performance series
  const quizData = attempts.slice().reverse().map((a, i) => ({ name: `Q${i + 1}`, score: Math.round(a.score) }));

  // Category distribution donut
  const catMap = new Map<string, number>();
  enrollments.forEach((e) => {
    const c = e.course.category?.name || "Other";
    catMap.set(c, (catMap.get(c) || 0) + 1);
  });
  const catData = Array.from(catMap, ([name, value]) => ({ name, value }));

  const continueCourses = enrollments.filter((e) => e.status === "ACTIVE").slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back, {user.name.split(" ")[0]} 👋</h2>
        <p className="text-muted-foreground">Here&apos;s an overview of your learning journey.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Courses" value={enrollments.length} icon={BookOpen} accent="primary" />
        <StatCard label="In Progress" value={inProgress} icon={GraduationCap} accent="blue" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} accent="violet" />
        <StatCard label="Certificates" value={certificates} icon={Award} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue learning */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Continue learning</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/my-courses">All courses <ArrowRight className="h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {continueCourses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                You haven&apos;t enrolled in any course yet.{" "}
                <Link href="/courses" className="font-medium text-primary">Browse courses →</Link>
              </div>
            ) : (
              continueCourses.map((e) => (
                <div key={e.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.course.title}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={e.progress} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground">{Math.round(e.progress)}%</span>
                    </div>
                  </div>
                  <Button size="sm" asChild><Link href={`/learn/${e.course.slug}`}>Resume</Link></Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Streak / completion */}
        <Card>
          <CardHeader><CardTitle>Learning summary</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3 rounded-lg bg-primary-soft p-4">
              <Flame className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{Math.max(inProgress, 1)} day streak</p>
                <p className="text-xs text-muted-foreground">Keep it up!</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall completion</span>
                <span className="font-semibold">{avgProgress}%</span>
              </div>
              <Progress value={avgProgress} className="mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Weekly study activity</CardTitle></CardHeader>
          <CardContent><AreaTrend data={weekly} dataKey="minutes" xKey="day" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quiz performance</CardTitle></CardHeader>
          <CardContent>
            {quizData.length ? <BarSeries data={quizData} dataKey="score" xKey="name" /> : <p className="py-16 text-center text-sm text-muted-foreground">No quiz attempts yet.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Courses by category</CardTitle></CardHeader>
          <CardContent>
            {catData.length ? <DonutChart data={catData} /> : <p className="py-16 text-center text-sm text-muted-foreground">No data yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentNotifs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
            ) : recentNotifs.map((n) => (
              <div key={n.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

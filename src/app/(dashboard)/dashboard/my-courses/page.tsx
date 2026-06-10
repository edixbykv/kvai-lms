import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "My Courses" };
export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const user = await requireUser();
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: { course: { include: { category: true } } },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Courses</h2>
          <p className="text-muted-foreground">{enrollments.length} enrolled course(s)</p>
        </div>
        <Button asChild><Link href="/courses">Browse more</Link></Button>
      </div>

      {enrollments.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">You haven&apos;t enrolled in any courses yet.</p>
          <Button asChild className="mt-4"><Link href="/courses">Explore courses</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <Card key={e.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {e.course.thumbnail && <Image src={e.course.thumbnail} alt={e.course.title} fill className="object-cover" />}
                <Badge variant={e.status === "COMPLETED" ? "success" : "soft"} className="absolute left-3 top-3 capitalize">
                  {e.status.toLowerCase()}
                </Badge>
              </div>
              <div className="p-4">
                {e.course.category && <span className="text-xs font-medium text-primary">{e.course.category.name}</span>}
                <h3 className="mt-1 line-clamp-2 font-semibold">{e.course.title}</h3>
                <div className="mt-3 flex items-center gap-2">
                  <Progress value={e.progress} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">{Math.round(e.progress)}%</span>
                </div>
                <Button className="mt-4 w-full" asChild>
                  <Link href={`/learn/${e.course.slug}`}>{e.progress > 0 ? "Continue" : "Start"} learning</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

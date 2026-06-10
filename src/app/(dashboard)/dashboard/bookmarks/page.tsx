import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Bookmark, PlayCircle } from "lucide-react";

export const metadata = { title: "Bookmarks" };
export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const user = await requireUser();
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    include: { lesson: { include: { section: { include: { course: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bookmarks</h2>
        <p className="text-muted-foreground">Lessons you&apos;ve saved for later.</p>
      </div>
      {bookmarks.length === 0 ? (
        <Card className="p-12 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No bookmarks yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookmarks.map((b) => b.lesson && (
            <Card key={b.id} className="flex items-center gap-3 p-4">
              <PlayCircle className="h-8 w-8 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.lesson.title}</p>
                <p className="truncate text-xs text-muted-foreground">{b.lesson.section.course.title}</p>
              </div>
              <Link href={`/learn/${b.lesson.section.course.slug}`} className="text-sm font-medium text-primary">Open</Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

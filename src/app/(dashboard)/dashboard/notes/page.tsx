import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { StickyNote } from "lucide-react";

export const metadata = { title: "Notes" };
export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const user = await requireUser();
  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    include: { lesson: { include: { section: { include: { course: true } } } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Notes</h2>
        <p className="text-muted-foreground">All notes you&apos;ve taken across lessons.</p>
      </div>
      {notes.length === 0 ? (
        <Card className="p-12 text-center">
          <StickyNote className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No notes yet. Take notes while watching lessons.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-center justify-between">
                <Link href={`/learn/${n.lesson.section.course.slug}`} className="text-sm font-medium text-primary hover:underline">
                  {n.lesson.section.course.title} · {n.lesson.title}
                </Link>
                <span className="text-xs text-muted-foreground">{formatDate(n.updatedAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{n.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

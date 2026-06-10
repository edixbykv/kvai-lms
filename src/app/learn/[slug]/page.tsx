import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CoursePlayer } from "@/components/learn/course-player";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/learn/${slug}`);

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      sections: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      quizzes: { where: { isPublished: true }, select: { id: true, title: true, type: true } },
    },
  });
  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
  });
  if (!enrollment) redirect(`/courses/${slug}`);

  const [progress, bookmarks] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId: user.id, lesson: { section: { courseId: course.id } } } }),
    prisma.bookmark.findMany({ where: { userId: user.id, lesson: { section: { courseId: course.id } } }, select: { lessonId: true } }),
  ]);

  const progressMap = Object.fromEntries(progress.map((p) => [p.lessonId, { completed: p.completed, lastPosition: p.lastPosition }]));
  const bookmarkSet = bookmarks.map((b) => b.lessonId).filter(Boolean) as string[];

  return (
    <CoursePlayer
      course={{
        id: course.id,
        title: course.title,
        slug: course.slug,
        sections: course.sections.map((s) => ({
          id: s.id,
          title: s.title,
          lessons: s.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            videoProvider: l.videoProvider,
            videoUrl: l.videoUrl,
            content: l.content,
            pdfUrl: l.pdfUrl,
            duration: l.duration,
          })),
        })),
        quizzes: course.quizzes,
      }}
      initialProgress={progressMap}
      bookmarks={bookmarkSet}
      overallProgress={enrollment.progress}
    />
  );
}

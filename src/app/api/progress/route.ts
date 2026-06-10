import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody, authGuard } from "@/lib/api";
import { progressSchema } from "@/lib/validations";
import { audit, notify } from "@/lib/audit";
import { generateCertificateId, generateVerificationCode } from "@/lib/certificate";

export const POST = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const data = await parseBody(req, progressSchema);

  const lesson = await prisma.lesson.findUnique({
    where: { id: data.lessonId },
    include: { section: { select: { courseId: true, course: { select: { slug: true, title: true } } } } },
  });
  if (!lesson) return fail(404, "Lesson not found");
  const courseId = lesson.section.courseId;

  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (!enrollment) return fail(403, "You are not enrolled in this course");

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: data.lessonId } },
    update: {
      watchedSeconds: data.watchedSeconds,
      lastPosition: data.lastPosition,
      ...(data.completed ? { completed: true, completedAt: new Date() } : {}),
    },
    create: {
      userId: user.id,
      lessonId: data.lessonId,
      watchedSeconds: data.watchedSeconds,
      lastPosition: data.lastPosition,
      completed: !!data.completed,
      completedAt: data.completed ? new Date() : null,
    },
  });

  // Recompute course progress
  const allLessons = await prisma.lesson.findMany({
    where: { section: { courseId } },
    select: { id: true },
  });
  const completedCount = await prisma.lessonProgress.count({
    where: { userId: user.id, completed: true, lessonId: { in: allLessons.map((l) => l.id) } },
  });
  const progress = allLessons.length ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const isComplete = progress >= 100;

  await prisma.enrollment.update({
    where: { userId_courseId: { userId: user.id, courseId } },
    data: {
      progress,
      lastAccessAt: new Date(),
      ...(isComplete && enrollment.status !== "COMPLETED" ? { status: "COMPLETED", completedAt: new Date() } : {}),
    },
  });

  // Auto-issue certificate on completion
  let certificateIssued = false;
  if (isComplete && enrollment.status !== "COMPLETED") {
    const existing = await prisma.certificate.findFirst({ where: { userId: user.id, courseId } });
    if (!existing) {
      await prisma.certificate.create({
        data: {
          certificateId: generateCertificateId(),
          verificationCode: generateVerificationCode(),
          userId: user.id,
          courseId,
          recipientName: user.name,
          courseTitle: lesson.section.course.title,
        },
      });
      certificateIssued = true;
      await notify(user.id, "CERTIFICATE", "Certificate earned! 🏆", `Congratulations on completing "${lesson.section.course.title}". Your certificate is ready.`, "/dashboard/certificates");
      await audit({ userId: user.id, action: "certificate.auto_issue", category: "certificate", entityId: courseId });
    }
  }

  return ok({ progress, completed: isComplete, certificateIssued });
});

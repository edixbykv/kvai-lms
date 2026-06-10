import { prisma } from "./prisma";
import { notify, audit } from "./audit";

/** Create (or reactivate) an enrollment and notify the student. Idempotent. */
export async function enrollUser(userId: string, courseId: string, orderId?: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true, slug: true } });
  if (!course) throw new Error("Course not found");

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { status: "ACTIVE", orderId },
    create: { userId, courseId, status: "ACTIVE", orderId, lastAccessAt: new Date() },
  });

  await notify(userId, "COURSE", "Enrollment successful 🎉", `You're now enrolled in "${course.title}". Start learning!`, `/learn/${course.slug}`);
  await audit({ userId, action: "course.enroll", category: "course", entityType: "course", entityId: courseId });

  return enrollment;
}

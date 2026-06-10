import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody, authGuard } from "@/lib/api";
import { enrollUser } from "@/lib/enroll";

export const POST = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const { courseId } = await parseBody(req, z.object({ courseId: z.string() }));

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED") return fail(404, "Course not available");
  if (!course.isFree) return fail(400, "This is a paid course. Please complete checkout.");

  const enrollment = await enrollUser(user.id, courseId);
  return ok({ enrollment, slug: course.slug });
});

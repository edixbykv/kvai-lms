import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, ok, parseBody, permissionGuard } from "@/lib/api";
import { courseSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";

export const PATCH = handler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await permissionGuard("course.edit");
  const { id } = await ctx.params;
  const data = await parseBody(req, courseSchema.partial());

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) return ok(null);

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...data,
      discountPrice: data.discountPrice ?? undefined,
      categoryId: data.categoryId ?? undefined,
      ...(data.status === "PUBLISHED" && !existing.publishedAt ? { publishedAt: new Date() } : {}),
    },
  });
  await audit({ userId: user.id, action: "course.update", category: "course", entityId: id });
  return ok(course);
});

export const DELETE = handler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await permissionGuard("course.delete");
  const { id } = await ctx.params;
  await prisma.course.delete({ where: { id } });
  await audit({ userId: user.id, action: "course.delete", category: "course", entityId: id });
  return ok({ deleted: true });
});

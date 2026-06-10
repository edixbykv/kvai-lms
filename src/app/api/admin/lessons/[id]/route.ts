import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, ok, permissionGuard } from "@/lib/api";

export const DELETE = handler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await permissionGuard("course.edit");
  const { id } = await ctx.params;
  await prisma.lesson.delete({ where: { id } });
  return ok({ deleted: true });
});

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, parseBody, authGuard } from "@/lib/api";

export const POST = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const { lessonId } = await parseBody(req, z.object({ lessonId: z.string() }));

  const existing = await prisma.bookmark.findFirst({ where: { userId: user.id, lessonId } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return ok({ bookmarked: false });
  }
  await prisma.bookmark.create({ data: { userId: user.id, lessonId } });
  return ok({ bookmarked: true });
});

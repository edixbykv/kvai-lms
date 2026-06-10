import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, authGuard } from "@/lib/api";

export const DELETE = handler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await authGuard();
  const { id } = await ctx.params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== user.id) return fail(404, "Note not found");
  await prisma.note.delete({ where: { id } });
  return ok({ deleted: true });
});

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, ok, created, parseBody, authGuard } from "@/lib/api";
import { noteSchema } from "@/lib/validations";

export const GET = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const lessonId = req.nextUrl.searchParams.get("lessonId");
  const notes = await prisma.note.findMany({
    where: { userId: user.id, ...(lessonId ? { lessonId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return ok(notes);
});

export const POST = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const data = await parseBody(req, noteSchema);
  const note = await prisma.note.create({
    data: { userId: user.id, lessonId: data.lessonId, content: data.content, timestamp: data.timestamp },
  });
  return created(note);
});

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, created, permissionGuard, parseBody } from "@/lib/api";

export const POST = handler(async (req: NextRequest) => {
  await permissionGuard("course.edit");
  const { courseId, title } = await parseBody(req, z.object({ courseId: z.string(), title: z.string().min(1) }));
  const count = await prisma.section.count({ where: { courseId } });
  const section = await prisma.section.create({ data: { courseId, title, order: count } });
  return created(section);
});

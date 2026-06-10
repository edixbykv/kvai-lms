import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, created, permissionGuard, parseBody } from "@/lib/api";

const schema = z.object({
  sectionId: z.string(),
  title: z.string().min(1),
  type: z.enum(["VIDEO", "PDF", "TEXT", "QUIZ", "ASSIGNMENT"]).default("VIDEO"),
  videoProvider: z.enum(["YOUTUBE", "VIMEO", "CLOUDINARY", "EXTERNAL"]).optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  pdfUrl: z.string().optional().nullable(),
  duration: z.number().int().min(0).default(0),
  isPreview: z.boolean().default(false),
});

export const POST = handler(async (req: NextRequest) => {
  await permissionGuard("course.edit");
  const data = await parseBody(req, schema);
  const count = await prisma.lesson.count({ where: { sectionId: data.sectionId } });
  const lesson = await prisma.lesson.create({
    data: {
      sectionId: data.sectionId,
      title: data.title,
      type: data.type,
      videoProvider: data.videoProvider ?? null,
      videoUrl: data.videoUrl ?? null,
      content: data.content ?? null,
      pdfUrl: data.pdfUrl ?? null,
      duration: data.duration,
      isPreview: data.isPreview,
      order: count,
    },
  });

  // keep course duration roughly in sync
  const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
  if (section) {
    const agg = await prisma.lesson.aggregate({ where: { section: { courseId: section.courseId } }, _sum: { duration: true } });
    await prisma.course.update({ where: { id: section.courseId }, data: { duration: Math.round((agg._sum.duration ?? 0) / 60) } });
  }

  return created(lesson);
});

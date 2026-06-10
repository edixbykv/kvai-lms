import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, ok, created, parseBody, permissionGuard } from "@/lib/api";
import { courseSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { nanoid } from "nanoid";

export const GET = handler(async () => {
  await permissionGuard("course.edit");
  const courses = await prisma.course.findMany({
    include: { category: true, _count: { select: { enrollments: true, sections: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(courses);
});

export const POST = handler(async (req: NextRequest) => {
  const user = await permissionGuard("course.create");
  const data = await parseBody(req, courseSchema);

  let slug = slugify(data.title);
  if (await prisma.course.findUnique({ where: { slug } })) slug = `${slug}-${nanoid(4)}`;

  const course = await prisma.course.create({
    data: {
      title: data.title,
      slug,
      subtitle: data.subtitle,
      description: data.description,
      thumbnail: data.thumbnail,
      price: data.price,
      discountPrice: data.discountPrice ?? null,
      isFree: data.isFree,
      level: data.level,
      language: data.language,
      categoryId: data.categoryId || null,
      status: data.status,
      learningOutcomes: data.learningOutcomes,
      requirements: data.requirements,
      instructorId: user.id,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });
  await audit({ userId: user.id, action: "course.create", category: "course", entityId: course.id });
  return created(course);
});

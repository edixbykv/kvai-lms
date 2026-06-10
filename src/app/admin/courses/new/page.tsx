import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/admin/course-form";

export const metadata = { title: "New Course" };
export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create a course</h2>
      <CourseForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}

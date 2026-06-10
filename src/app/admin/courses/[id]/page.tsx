import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseForm } from "@/components/admin/course-form";
import { CurriculumBuilder } from "@/components/admin/curriculum-builder";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, categories] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: { sections: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{course.title}</h2>
          <Badge variant={course.status === "PUBLISHED" ? "success" : "secondary"} className="mt-1">{course.status}</Badge>
        </div>
        <Button variant="outline" asChild><Link href={`/courses/${course.slug}`} target="_blank">View page <ExternalLink className="h-4 w-4" /></Link></Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <CourseForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            initial={{
              id: course.id, title: course.title, subtitle: course.subtitle ?? "",
              description: course.description ?? "", thumbnail: course.thumbnail ?? "",
              price: Number(course.price), discountPrice: course.discountPrice ? Number(course.discountPrice) : null,
              isFree: course.isFree, level: course.level, language: course.language,
              categoryId: course.categoryId, status: course.status,
              learningOutcomes: course.learningOutcomes, requirements: course.requirements,
            }}
          />
        </TabsContent>
        <TabsContent value="curriculum">
          <CurriculumBuilder
            courseId={course.id}
            sections={course.sections.map((s) => ({
              id: s.id, title: s.title,
              lessons: s.lessons.map((l) => ({ id: l.id, title: l.title, type: l.type, isPreview: l.isPreview })),
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

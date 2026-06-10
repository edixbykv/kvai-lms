import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { EnrollButton } from "@/components/course/enroll-button";
import { formatCurrency, formatDuration } from "@/lib/utils";
import {
  CheckCircle2, Clock, BarChart3, Globe, PlayCircle, FileText,
  Award, Star, BookOpen, Lock,
} from "lucide-react";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) return { title: "Course not found" };
  return { title: course.metaTitle || course.title, description: course.metaDescription || course.subtitle };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, user] = await Promise.all([
    prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        instructor: true,
        sections: { include: { lessons: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
        reviews: { include: { user: true }, take: 5, orderBy: { createdAt: "desc" } },
        _count: { select: { enrollments: true, reviews: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!course || course.status !== "PUBLISHED") notFound();

  const enrollment = user
    ? await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } })
    : null;

  const totalLessons = course.sections.reduce((a, s) => a + s.lessons.length, 0);
  const price = course.discountPrice ? Number(course.discountPrice) : Number(course.price);
  const avgRating = course.reviews.length
    ? course.reviews.reduce((a, r) => a + r.rating, 0) / course.reviews.length
    : 4.7;

  return (
    <div>
      {/* Header */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            {course.category && <Badge variant="soft" className="mb-3">{course.category.name}</Badge>}
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{course.title}</h1>
            {course.subtitle && <p className="mt-3 text-lg text-slate-300">{course.subtitle}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{avgRating.toFixed(1)} ({course._count.reviews} reviews)</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{totalLessons} lessons</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{formatDuration(course.duration || 0)}</span>
              <span className="flex items-center gap-1.5 capitalize"><BarChart3 className="h-4 w-4" />{course.level.replace("_", " ").toLowerCase()}</span>
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" />{course.language}</span>
            </div>
            {course.instructor && (
              <p className="mt-4 text-sm text-slate-400">Created by <span className="font-medium text-white">{course.instructor.name}</span></p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        {/* Main */}
        <div className="space-y-10 lg:col-span-2">
          {course.learningOutcomes.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold">What you&apos;ll learn</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.learningOutcomes.map((o, i) => (
                  <li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />{o}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Curriculum */}
          <div>
            <h2 className="text-xl font-bold">Course content</h2>
            <p className="mt-1 text-sm text-muted-foreground">{course.sections.length} sections · {totalLessons} lessons</p>
            <div className="mt-4 rounded-xl border border-border">
              <Accordion type="multiple" className="px-4">
                {course.sections.map((s) => (
                  <AccordionItem key={s.id} value={s.id}>
                    <AccordionTrigger>
                      <span className="flex-1 text-left font-medium text-foreground">{s.title}</span>
                      <span className="mr-2 text-xs text-muted-foreground">{s.lessons.length} lessons</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1">
                        {s.lessons.map((l) => (
                          <li key={l.id} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm">
                            {l.type === "VIDEO" ? <PlayCircle className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                            <span className="flex-1 text-foreground">{l.title}</span>
                            {l.isPreview ? (
                              <Badge variant="soft">Preview</Badge>
                            ) : !enrollment ? (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : null}
                            {l.duration > 0 && <span className="text-xs text-muted-foreground">{Math.round(l.duration / 60)}m</span>}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Requirements */}
          {course.requirements.length > 0 && (
            <div>
              <h2 className="text-xl font-bold">Requirements</h2>
              <ul className="mt-4 space-y-2">
                {course.requirements.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          {course.description && (
            <div>
              <h2 className="text-xl font-bold">Description</h2>
              <div className="prose-content mt-4 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: course.description }} />
            </div>
          )}

          {/* Reviews */}
          {course.reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-bold">Student reviews</h2>
              <div className="mt-4 space-y-4">
                {course.reviews.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{r.user?.name ?? "Student"}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                      </div>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {course.thumbnail && <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />}
            </div>
            <div className="p-6">
              <div className="flex items-baseline gap-2">
                {course.isFree ? (
                  <span className="text-3xl font-bold text-primary">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">{formatCurrency(price)}</span>
                    {course.discountPrice && <span className="text-base text-muted-foreground line-through">{formatCurrency(Number(course.price))}</span>}
                  </>
                )}
              </div>

              <div className="mt-5">
                <EnrollButton
                  courseId={course.id}
                  slug={course.slug}
                  isFree={course.isFree}
                  price={price}
                  title={course.title}
                  enrolled={!!enrollment}
                  authed={!!user}
                />
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Certificate of completion</li>
                <li className="flex items-center gap-2"><PlayCircle className="h-4 w-4 text-primary" /> {totalLessons} on-demand lessons</li>
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Lifetime access</li>
                <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Learn on any device</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

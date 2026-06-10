import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CourseCard, CourseCardData } from "@/components/shared/course-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Courses" };
export const revalidate = 30;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; level?: string; price?: string }>;
}) {
  const sp = await searchParams;

  const where: Prisma.CourseWhereInput = { status: "PUBLISHED" };
  if (sp.category) where.category = { slug: sp.category };
  if (sp.level) where.level = sp.level as never;
  if (sp.price === "free") where.isFree = true;
  if (sp.price === "paid") where.isFree = false;
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q, mode: "insensitive" } },
      { subtitle: { contains: sp.q, mode: "insensitive" } },
    ];
  }

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where,
      include: { category: true, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  const cards: CourseCardData[] = courses.map((c) => ({
    slug: c.slug, title: c.title, subtitle: c.subtitle, thumbnail: c.thumbnail,
    price: Number(c.price), discountPrice: c.discountPrice ? Number(c.discountPrice) : null,
    isFree: c.isFree, level: c.level, duration: c.duration,
    category: c.category?.name, students: c._count.enrollments,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore our courses</h1>
        <p className="mt-2 text-muted-foreground">Discover {courses.length} courses to grow your skills.</p>
      </div>

      {/* Search */}
      <form className="mx-auto mt-8 max-w-2xl" action="/courses">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q} placeholder="Search courses…" className="h-12 pl-10" />
        </div>
      </form>

      {/* Category chips */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link href="/courses">
          <Badge variant={!sp.category ? "default" : "outline"} className="cursor-pointer px-4 py-1.5">All</Badge>
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/courses?category=${c.slug}`}>
            <Badge variant={sp.category === c.slug ? "default" : "outline"} className="cursor-pointer px-4 py-1.5">{c.name}</Badge>
          </Link>
        ))}
      </div>

      {/* Price filter */}
      <div className="mt-3 flex items-center justify-center gap-2 text-sm">
        {[
          { key: undefined, label: "All prices" },
          { key: "free", label: "Free" },
          { key: "paid", label: "Paid" },
        ].map((p) => {
          const qs = new URLSearchParams();
          if (sp.category) qs.set("category", sp.category);
          if (sp.q) qs.set("q", sp.q);
          if (p.key) qs.set("price", p.key);
          return (
            <Link key={p.label} href={`/courses?${qs.toString()}`}
              className={`rounded-full px-3 py-1 ${sp.price === p.key || (!sp.price && !p.key) ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </Link>
          );
        })}
      </div>

      {/* Grid */}
      {cards.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground">
          <p>No courses found. Try a different search or filter.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((c) => <CourseCard key={c.slug} course={c} />)}
        </div>
      )}
    </div>
  );
}

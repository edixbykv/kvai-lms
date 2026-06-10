import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard, CourseCardData } from "@/components/shared/course-card";
import {
  ArrowRight, Award, BookOpen, Users, Star, ShieldCheck,
  PlayCircle, GraduationCap, CheckCircle2, Building2, Quote,
} from "lucide-react";

export const revalidate = 60;

async function getData() {
  const [courses, categories, stories, counts] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.category.findMany({ include: { _count: { select: { courses: true } } }, orderBy: { order: "asc" }, take: 6 }),
    prisma.successStory.findMany({ where: { featured: true }, take: 3 }),
    Promise.all([
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.user.count(),
      prisma.certificate.count(),
      prisma.enrollment.count(),
    ]),
  ]);
  return { courses, categories, stories, counts };
}

export default async function HomePage() {
  const { courses, categories, stories, counts } = await getData();
  const [courseCount, userCount, certCount, enrollCount] = counts;

  const cards: CourseCardData[] = courses.map((c) => ({
    slug: c.slug, title: c.title, subtitle: c.subtitle, thumbnail: c.thumbnail,
    price: Number(c.price), discountPrice: c.discountPrice ? Number(c.discountPrice) : null,
    isFree: c.isFree, level: c.level, duration: c.duration,
    category: c.category?.name, students: c._count.enrollments,
  }));

  const stats = [
    { icon: BookOpen, value: `${courseCount}+`, label: "Courses" },
    { icon: Users, value: `${Math.max(userCount, 1)}+`, label: "Learners" },
    { icon: Award, value: `${certCount}+`, label: "Certificates issued" },
    { icon: GraduationCap, value: `${enrollCount}+`, label: "Enrollments" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-soft to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
          <div className="animate-fade-in">
            <Badge variant="soft" className="mb-4">🎓 Trusted by institutes & corporates</Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Learn new skills.{" "}
              <span className="text-primary">Advance your career.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              KVAI LMS offers expert-led online courses with hands-on projects,
              quizzes and verifiable certificates — for students, training institutes,
              skill councils and corporate teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/courses">Explore Courses <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Start Free <PlayCircle className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Verifiable certificates</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Learn anywhere</span>
            </div>
          </div>
          <div className="relative animate-fade-in">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80"
                alt="Students learning online"
                fill className="object-cover" priority
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-border bg-white p-4 shadow-lg sm:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary"><Award className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-semibold">Industry certificates</p>
                  <p className="text-xs text-muted-foreground">QR-verifiable & shareable</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary"><s.icon className="h-6 w-6" /></span>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Browse by category</h2>
          <p className="mt-2 text-muted-foreground">Find the right path for your goals.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} href={`/courses?category=${c.slug}`}
              className="group flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary hover:shadow-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-semibold leading-tight">{c.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c._count.courses} courses</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Featured courses</h2>
              <p className="mt-2 text-muted-foreground">Hand-picked courses to get you started.</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex"><Link href="/courses">View all <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => <CourseCard key={c.slug} course={c} />)}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Why learn with KVAI LMS</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: Award, title: "Verifiable Certificates", desc: "Earn certificates with a unique ID and QR code that anyone can verify online." },
            { icon: ShieldCheck, title: "Secure & Trusted", desc: "Enterprise-grade security, audit logs and role-based access used by institutes." },
            { icon: Building2, title: "For Teams & Institutes", desc: "Multi-admin support, analytics and management tools for organisations." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary"><f.icon className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {stories.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Learner success stories</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {stories.map((s) => (
                <div key={s.id} className="rounded-xl border border-border bg-card p-6">
                  <Quote className="h-7 w-7 text-primary/30" />
                  <p className="mt-3 text-sm text-foreground">{s.content}</p>
                  <div className="mt-4 flex items-center gap-3">
                    {s.image && <Image src={s.image} alt={s.name} width={44} height={44} className="rounded-full" />}
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: s.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to start learning?</h2>
          <p className="mx-auto mt-3 max-w-xl text-green-50">
            Create a free account and explore courses today. Upgrade anytime to unlock premium content and certificates.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" variant="secondary" asChild><Link href="/register">Create free account</Link></Button>
            <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10" asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

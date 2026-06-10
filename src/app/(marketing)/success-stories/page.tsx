import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/page-hero";
import { Star, Quote } from "lucide-react";

export const metadata = { title: "Success Stories" };
export const revalidate = 120;

export default async function SuccessStoriesPage() {
  const stories = await prisma.successStory.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHero title="Learner Success Stories" subtitle="Real outcomes from learners who transformed their careers with KVAI LMS." />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Quote className="h-7 w-7 text-primary/30" />
              <p className="mt-3 text-sm">{s.content}</p>
              <div className="mt-4 flex items-center gap-3">
                {s.image && <Image src={s.image} alt={s.name} width={48} height={48} className="rounded-full" />}
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
    </>
  );
}

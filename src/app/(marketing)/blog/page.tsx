import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/page-hero";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blog" };
export const revalidate = 60;

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    include: { author: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <PageHero title="KVAI Blog" subtitle="Insights, tips and stories to power your learning journey." />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground">No posts yet. Check back soon!</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
                {p.coverImage && (
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <Image src={p.coverImage} alt={p.title} fill className="object-cover transition-transform group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 2).map((t) => <Badge key={t} variant="soft">{t}</Badge>)}
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-semibold group-hover:text-primary">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
                  <div className="mt-auto pt-4 text-xs text-muted-foreground">
                    {p.author?.name} · {p.publishedAt ? formatDate(p.publishedAt) : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

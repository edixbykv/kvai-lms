import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  return { title: post?.metaTitle || post?.title || "Blog", description: post?.metaDescription || post?.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug }, include: { author: true } });
  if (!post || post.status !== "PUBLISHED") notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap gap-1">
        {post.tags.map((t) => <Badge key={t} variant="soft">{t}</Badge>)}
      </div>
      <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        By {post.author?.name} · {post.publishedAt ? formatDate(post.publishedAt) : ""}
      </p>
      {post.coverImage && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-border">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        </div>
      )}
      <div className="prose-content mt-8 text-foreground" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

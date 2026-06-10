import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/page-hero";

export const metadata = { title: "Terms & Conditions" };
export const revalidate = 300;

export default async function TermsPage() {
  const page = await prisma.page.findUnique({ where: { slug: "terms" } });
  return (
    <>
      <PageHero title={page?.title || "Terms & Conditions"} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose-content text-muted-foreground" dangerouslySetInnerHTML={{ __html: page?.content || "" }} />
      </div>
    </>
  );
}

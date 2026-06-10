import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/page-hero";

export const metadata = { title: "Privacy Policy" };
export const revalidate = 300;

export default async function PrivacyPage() {
  const page = await prisma.page.findUnique({ where: { slug: "privacy" } });
  return (
    <>
      <PageHero title={page?.title || "Privacy Policy"} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose-content text-muted-foreground" dangerouslySetInnerHTML={{ __html: page?.content || "" }} />
      </div>
    </>
  );
}

import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/page-hero";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export const metadata = { title: "FAQ" };
export const revalidate = 300;

export default async function FaqPage() {
  const faqs = await prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
  const groups = faqs.reduce<Record<string, typeof faqs>>((acc, f) => {
    const key = f.category || "General";
    (acc[key] ||= []).push(f);
    return acc;
  }, {});

  return (
    <>
      <PageHero title="Frequently Asked Questions" subtitle="Everything you need to know about learning with KVAI LMS." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat} className="mb-8">
            <h2 className="mb-2 text-lg font-bold text-primary">{cat}</h2>
            <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
              {items.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger>{f.question}</AccordionTrigger>
                  <AccordionContent>{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </>
  );
}

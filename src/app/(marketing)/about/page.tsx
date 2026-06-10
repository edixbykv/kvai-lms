import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/page-hero";
import { Target, Eye, Heart } from "lucide-react";

export const metadata = { title: "About Us" };
export const revalidate = 300;

export default async function AboutPage() {
  const page = await prisma.page.findUnique({ where: { slug: "about" } });
  return (
    <>
      <PageHero title={page?.title || "About KVAI LMS"} subtitle="Empowering learners and organisations across India." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose-content text-muted-foreground" dangerouslySetInnerHTML={{ __html: page?.content || "" }} />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Target, title: "Our Mission", desc: "Make high-quality skill education accessible and affordable for everyone." },
            { icon: Eye, title: "Our Vision", desc: "Become India's most trusted learning platform for individuals and institutes." },
            { icon: Heart, title: "Our Values", desc: "Quality, integrity, accessibility and learner success above all." },
          ].map((v) => (
            <div key={v.title} className="rounded-xl border border-border p-5 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary"><v.icon className="h-6 w-6" /></span>
              <h3 className="mt-3 font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

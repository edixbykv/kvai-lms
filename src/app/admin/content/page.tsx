import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { FileText, HelpCircle, BookOpen, ExternalLink } from "lucide-react";

export const metadata = { title: "Content / CMS" };
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [posts, faqs, pages, stories] = await Promise.all([
    prisma.blogPost.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.fAQ.findMany({ orderBy: { order: "asc" } }),
    prisma.page.findMany(),
    prisma.successStory.count(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Content / CMS</h2>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: FileText, label: "Blog posts", value: posts.length },
          { icon: HelpCircle, label: "FAQs", value: faqs.length },
          { icon: BookOpen, label: "Pages", value: pages.length },
          { icon: FileText, label: "Success stories", value: stories },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Blog posts</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Tags</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell><Badge variant={p.status === "PUBLISHED" ? "success" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.tags.join(", ")}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" asChild><Link href={`/blog/${p.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>CMS pages</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {pages.map((pg) => (
              <Link key={pg.id} href={`/${pg.slug}`} target="_blank" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted">
                <span className="text-sm font-medium">{pg.title}</span>
                <Badge variant="outline">/{pg.slug}</Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

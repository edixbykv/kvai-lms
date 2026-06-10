import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, BookOpen } from "lucide-react";

export const metadata = { title: "Digital Library" };
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  await requireUser();
  const items = await prisma.libraryItem.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Digital Library</h2>
        <p className="text-muted-foreground">eBooks, PDFs and study materials available to you.</p>
      </div>
      {items.length === 0 ? (
        <Card className="p-12 text-center"><BookOpen className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 text-muted-foreground">No materials yet.</p></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card key={it.id} className="p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary"><FileText className="h-5 w-5" /></span>
                <Badge variant="outline">{it.type}</Badge>
              </div>
              <h3 className="mt-3 font-semibold">{it.title}</h3>
              {it.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.description}</p>}
              {it.category && <p className="mt-2 text-xs text-muted-foreground">{it.category.name}</p>}
              {it.downloadable && (
                <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                  <a href={`/api/library/${it.id}/download`} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> Download</a>
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

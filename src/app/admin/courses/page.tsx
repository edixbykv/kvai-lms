import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Pencil } from "lucide-react";

export const metadata = { title: "Manage Courses" };
export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: { category: true, _count: { select: { enrollments: true, sections: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Courses</h2>
          <p className="text-muted-foreground">{courses.length} course(s)</p>
        </div>
        <Button asChild><Link href="/admin/courses/new"><Plus className="h-4 w-4" /> New course</Link></Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.title}<div className="text-xs text-muted-foreground">{c._count.sections} sections</div></TableCell>
                <TableCell className="text-muted-foreground">{c.category?.name ?? "—"}</TableCell>
                <TableCell>{c.isFree ? "Free" : formatCurrency(Number(c.discountPrice ?? c.price))}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "PUBLISHED" ? "success" : c.status === "DRAFT" ? "secondary" : "outline"}>{c.status}</Badge>
                </TableCell>
                <TableCell>{c._count.enrollments}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.updatedAt)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild><Link href={`/admin/courses/${c.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

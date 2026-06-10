import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StudentActions } from "@/components/admin/student-actions";
import { initials, formatDate } from "@/lib/utils";

export const metadata = { title: "Students" };
export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: { slug: "student" } },
    include: { _count: { select: { enrollments: true, certificates: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Students</h2>
        <p className="text-muted-foreground">{students.length} student(s)</p>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Certificates</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">{s.image && <AvatarImage src={s.image} />}<AvatarFallback>{initials(s.name)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant={s.status === "ACTIVE" ? "success" : s.status === "SUSPENDED" ? "destructive" : "secondary"}>{s.status}</Badge></TableCell>
                <TableCell>{s._count.enrollments}</TableCell>
                <TableCell>{s._count.certificates}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground">{s.lastLoginAt ? formatDate(s.lastLoginAt) : "—"}</TableCell>
                <TableCell><StudentActions id={s.id} status={s.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

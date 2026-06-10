import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

export const metadata = { title: "Quizzes" };
export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage() {
  const quizzes = await prisma.quiz.findMany({
    include: { course: true, _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quizzes & Exams</h2>
        <p className="text-muted-foreground">{quizzes.length} quiz(zes) across all courses</p>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Quiz</TableHead><TableHead>Course</TableHead><TableHead>Type</TableHead><TableHead>Questions</TableHead><TableHead>Attempts</TableHead><TableHead>Pass mark</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.title}</TableCell>
                <TableCell className="text-muted-foreground">{q.course?.title ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{q.type.replace("_", " ")}</Badge></TableCell>
                <TableCell>{q._count.questions}</TableCell>
                <TableCell>{q._count.attempts}</TableCell>
                <TableCell>{q.passingScore}%</TableCell>
                <TableCell><Badge variant={q.isPublished ? "success" : "secondary"}>{q.isPublished ? "Published" : "Draft"}</Badge></TableCell>
                <TableCell><Button size="sm" variant="ghost" asChild><Link href={`/quiz/${q.id}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button></TableCell>
              </TableRow>
            ))}
            {quizzes.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No quizzes yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { QuizRunner } from "@/components/quiz/quiz-runner";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/quiz/${id}`);

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { select: { slug: true, title: true } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" }, select: { id: true, text: true } } },
      },
    },
  });
  if (!quiz || !quiz.isPublished) notFound();

  // Optional randomisation / limit
  let questions = quiz.questions;
  if (quiz.randomize) questions = [...questions].sort(() => Math.random() - 0.5);
  if (quiz.questionCount && quiz.questionCount > 0) questions = questions.slice(0, quiz.questionCount);

  return (
    <QuizRunner
      quiz={{
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        type: quiz.type,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        courseSlug: quiz.course?.slug ?? null,
        courseTitle: quiz.course?.title ?? null,
      }}
      questions={questions.map((q) => ({
        id: q.id, text: q.text, type: q.type, points: q.points,
        options: q.options,
      }))}
    />
  );
}

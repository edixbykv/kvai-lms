import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody, authGuard } from "@/lib/api";
import { audit } from "@/lib/audit";

const schema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOptions: z.array(z.string()).default([]),
    answerText: z.string().optional(),
  })),
});

export const POST = handler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const user = await authGuard();
  const { id } = await ctx.params;
  const { answers } = await parseBody(req, schema);

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: { include: { options: true } } },
  });
  if (!quiz) return fail(404, "Quiz not found");

  // Enforce attempt limit
  if (quiz.attemptsAllowed > 0) {
    const used = await prisma.quizAttempt.count({ where: { quizId: id, userId: user.id, status: { not: "IN_PROGRESS" } } });
    if (used >= quiz.attemptsAllowed) return fail(403, "You have used all attempts for this quiz");
  }

  let totalPoints = 0;
  let earnedPoints = 0;
  const answerRecords: { questionId: string; selectedOptions: string[]; answerText?: string; isCorrect: boolean; awardedPoints: number }[] = [];

  for (const q of quiz.questions) {
    totalPoints += q.points;
    const submitted = answers.find((a) => a.questionId === q.id);
    const selected = submitted?.selectedOptions ?? [];

    let isCorrect = false;
    if (q.type === "SHORT_ANSWER") {
      // Manual grading — leave uncorrected for now
      isCorrect = false;
    } else {
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
      const selectedSorted = [...selected].sort();
      isCorrect = correctIds.length === selectedSorted.length && correctIds.every((c, i) => c === selectedSorted[i]);
    }
    const awarded = isCorrect ? q.points : 0;
    earnedPoints += awarded;
    answerRecords.push({ questionId: q.id, selectedOptions: selected, answerText: submitted?.answerText, isCorrect, awardedPoints: awarded });
  }

  const score = totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= quiz.passingScore;

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: id, userId: user.id, status: "GRADED",
      score, totalPoints, earnedPoints, passed, submittedAt: new Date(),
      answers: { create: answerRecords },
    },
  });

  await audit({ userId: user.id, action: "quiz.submit", category: "course", entityId: id, metadata: { score, passed } });

  return ok({
    attemptId: attempt.id, score, passed, earnedPoints, totalPoints,
    passingScore: quiz.passingScore,
    showAnswers: quiz.showAnswers,
    review: quiz.showAnswers ? quiz.questions.map((q) => ({
      id: q.id, text: q.text,
      correctOptions: q.options.filter((o) => o.isCorrect).map((o) => o.id),
      explanation: q.explanation,
    })) : [],
  });
});

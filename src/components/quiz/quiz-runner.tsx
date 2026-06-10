"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle, Trophy, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Q { id: string; text: string; type: string; points: number; options: { id: string; text: string }[] }
interface QuizMeta {
  id: string; title: string; description: string | null; type: string;
  timeLimit: number | null; passingScore: number; courseSlug: string | null; courseTitle: string | null;
}
interface Result {
  score: number; passed: boolean; earnedPoints: number; totalPoints: number; passingScore: number;
  review: { id: string; text: string; correctOptions: string[]; explanation: string | null }[];
}

export function QuizRunner({ quiz, questions }: { quiz: QuizMeta; questions: Q[] }) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const submit = useCallback(async () => {
    setSubmitting(true);
    const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: questions.map((q) => ({ questionId: q.id, selectedOptions: answers[q.id] || [] })) }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) setResult(data.data);
    else toast.error(data.message || "Submission failed");
  }, [quiz.id, questions, answers]);

  useEffect(() => {
    if (!started || !quiz.timeLimit || result) return;
    setTimeLeft(quiz.timeLimit * 60);
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s === null) return null;
        if (s <= 1) { clearInterval(t); submit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, quiz.timeLimit, result, submit]);

  function toggle(qid: string, oid: string, multi: boolean) {
    setAnswers((a) => {
      const cur = a[qid] || [];
      if (multi) return { ...a, [qid]: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid] };
      return { ...a, [qid]: [oid] };
    });
  }

  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length;

  // ---- Intro ----
  if (!started && !result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header courseSlug={quiz.courseSlug} />
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <Badge variant="soft" className="mb-3">{quiz.type.replace("_", " ")}</Badge>
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              {quiz.description && <p className="mt-2 text-muted-foreground">{quiz.description}</p>}
              <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                <Stat label="Questions" value={String(questions.length)} />
                <Stat label="Pass mark" value={`${quiz.passingScore}%`} />
                <Stat label="Time" value={quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"} />
              </div>
              <Button size="lg" className="mt-8 w-full" onClick={() => setStarted(true)}>Start quiz</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---- Result ----
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header courseSlug={quiz.courseSlug} />
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <span className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full", result.passed ? "bg-primary-soft text-primary" : "bg-red-50 text-red-600")}>
                {result.passed ? <Trophy className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
              </span>
              <h1 className="mt-4 text-2xl font-bold">{result.passed ? "Congratulations! 🎉" : "Keep practising"}</h1>
              <p className="mt-1 text-muted-foreground">You scored {result.score}% ({result.earnedPoints}/{result.totalPoints} points)</p>
              <Progress value={result.score} className="mt-4" />
              <p className="mt-2 text-sm text-muted-foreground">{result.passed ? "You passed" : `Pass mark is ${result.passingScore}%`}</p>
              <div className="mt-8 flex gap-2">
                {quiz.courseSlug && <Button variant="outline" className="flex-1" asChild><Link href={`/learn/${quiz.courseSlug}`}>Back to course</Link></Button>}
                <Button className="flex-1" asChild><Link href="/dashboard">Dashboard <ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </CardContent>
          </Card>

          {result.review.length > 0 && (
            <div className="mt-6 space-y-4">
              <h2 className="font-semibold">Answer review</h2>
              {questions.map((q) => {
                const rev = result.review.find((r) => r.id === q.id);
                const selected = answers[q.id] || [];
                return (
                  <Card key={q.id}><CardContent className="p-4">
                    <p className="font-medium">{q.text}</p>
                    <div className="mt-3 space-y-1">
                      {q.options.map((o) => {
                        const correct = rev?.correctOptions.includes(o.id);
                        const chosen = selected.includes(o.id);
                        return (
                          <div key={o.id} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                            correct ? "bg-green-50 text-green-800" : chosen ? "bg-red-50 text-red-800" : "bg-muted/40")}>
                            {correct ? <CheckCircle2 className="h-4 w-4" /> : chosen ? <XCircle className="h-4 w-4" /> : <span className="h-4 w-4" />}
                            {o.text}
                          </div>
                        );
                      })}
                    </div>
                    {rev?.explanation && <p className="mt-2 text-xs text-muted-foreground">💡 {rev.explanation}</p>}
                  </CardContent></Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Quiz ----
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-4">
        <Logo showText={false} />
        <span className="text-sm font-medium">{quiz.title}</span>
        {timeLeft !== null && (
          <Badge variant={timeLeft < 60 ? "destructive" : "outline"} className="gap-1">
            <Clock className="h-3.5 w-3.5" /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </Badge>
        )}
      </header>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Progress value={(answeredCount / questions.length) * 100} className="mb-6" />
        <div className="space-y-5">
          {questions.map((q, i) => {
            const multi = q.type === "MULTIPLE_CHOICE";
            return (
              <Card key={q.id}><CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{i + 1}. {q.text}</p>
                  <Badge variant="outline" className="shrink-0">{q.points} pt</Badge>
                </div>
                {multi && <p className="mt-1 text-xs text-muted-foreground">Select all that apply</p>}
                <div className="mt-3 space-y-2">
                  {q.options.map((o) => {
                    const chosen = (answers[q.id] || []).includes(o.id);
                    return (
                      <button key={o.id} onClick={() => toggle(q.id, o.id, multi)}
                        className={cn("flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                          chosen ? "border-primary bg-primary-soft" : "border-border hover:bg-muted")}>
                        <span className={cn("flex h-5 w-5 items-center justify-center border", multi ? "rounded" : "rounded-full", chosen ? "border-primary bg-primary text-white" : "border-muted-foreground")}>
                          {chosen && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </span>
                        {o.text}
                      </button>
                    );
                  })}
                </div>
              </CardContent></Card>
            );
          })}
        </div>
        <Button size="lg" className="mt-6 w-full" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting…" : `Submit quiz (${answeredCount}/${questions.length} answered)`}
        </Button>
      </div>
    </div>
  );
}

function Header({ courseSlug }: { courseSlug: string | null }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
      <Logo showText={false} />
      <Button variant="outline" size="sm" asChild>
        <Link href={courseSlug ? `/learn/${courseSlug}` : "/dashboard"}>Exit</Link>
      </Button>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, Circle, PlayCircle, FileText, ChevronLeft, ChevronRight,
  Bookmark, BookmarkCheck, Menu, X, FileQuestion, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Lesson {
  id: string; title: string; type: string;
  videoProvider: string | null; videoUrl: string | null;
  content: string | null; pdfUrl: string | null; duration: number;
}
interface Section { id: string; title: string; lessons: Lesson[] }
interface CourseData {
  id: string; title: string; slug: string; sections: Section[];
  quizzes: { id: string; title: string; type: string }[];
}

export function CoursePlayer({
  course, initialProgress, bookmarks, overallProgress,
}: {
  course: CourseData;
  initialProgress: Record<string, { completed: boolean; lastPosition: number }>;
  bookmarks: string[];
  overallProgress: number;
}) {
  const router = useRouter();
  const flatLessons = useMemo(() => course.sections.flatMap((s) => s.lessons), [course.sections]);

  const firstIncomplete = flatLessons.find((l) => !initialProgress[l.id]?.completed) || flatLessons[0];
  const [currentId, setCurrentId] = useState(firstIncomplete?.id);
  const [progressMap, setProgressMap] = useState(initialProgress);
  const [bookmarkSet, setBookmarkSet] = useState<string[]>(bookmarks);
  const [overall, setOverall] = useState(overallProgress);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notes, setNotes] = useState<{ id: string; content: string }[]>([]);

  const current = flatLessons.find((l) => l.id === currentId);
  const currentIndex = flatLessons.findIndex((l) => l.id === currentId);
  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;

  // Load notes for current lesson
  useEffect(() => {
    if (!currentId) return;
    fetch(`/api/notes?lessonId=${currentId}`)
      .then((r) => r.json())
      .then((d) => setNotes(d.data || []))
      .catch(() => {});
  }, [currentId]);

  async function saveProgress(lessonId: string, completed: boolean) {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, watchedSeconds: 0, lastPosition: 0, completed }),
    });
    const data = await res.json();
    if (res.ok) {
      setProgressMap((m) => ({ ...m, [lessonId]: { completed, lastPosition: 0 } }));
      setOverall(data.data.progress);
      if (data.data.certificateIssued) {
        toast.success("🏆 Course completed! Certificate issued.", { duration: 6000 });
        router.refresh();
      }
    }
  }

  function goTo(idx: number) {
    if (idx >= 0 && idx < flatLessons.length) {
      setCurrentId(flatLessons[idx].id);
      setSidebarOpen(false);
    }
  }

  async function markComplete() {
    if (!current) return;
    await saveProgress(current.id, true);
    toast.success("Lesson completed");
    if (currentIndex < flatLessons.length - 1) goTo(currentIndex + 1);
  }

  async function toggleBookmark() {
    if (!current) return;
    const res = await fetch("/api/bookmarks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: current.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setBookmarkSet((s) => data.data.bookmarked ? [...s, current.id] : s.filter((id) => id !== current.id));
    }
  }

  async function addNote() {
    if (!current || !note.trim()) return;
    setSavingNote(true);
    const res = await fetch("/api/notes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: current.id, content: note }),
    });
    const data = await res.json();
    setSavingNote(false);
    if (res.ok) { setNotes((n) => [data.data, ...n]); setNote(""); toast.success("Note saved"); }
  }

  const embedUrl = (l: Lesson) => {
    if (l.videoProvider === "YOUTUBE" && l.videoUrl) {
      return l.videoUrl.includes("/embed/") ? l.videoUrl : l.videoUrl.replace("watch?v=", "embed/");
    }
    return l.videoUrl || "";
  };

  const Sidebar = (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border p-4">
        <p className="text-xs text-muted-foreground">{completedCount}/{flatLessons.length} lessons</p>
        <Progress value={overall} className="mt-2" />
        <p className="mt-1 text-xs font-medium text-primary">{Math.round(overall)}% complete</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {course.sections.map((s) => (
          <div key={s.id}>
            <p className="bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</p>
            {s.lessons.map((l) => {
              const done = progressMap[l.id]?.completed;
              const active = l.id === currentId;
              return (
                <button
                  key={l.id}
                  onClick={() => { setCurrentId(l.id); setSidebarOpen(false); }}
                  className={cn("flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted", active && "bg-primary-soft")}
                >
                  {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="flex-1">
                    <span className={cn("block", active ? "font-medium text-primary" : "text-foreground")}>{l.title}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      {l.type === "VIDEO" ? <PlayCircle className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      {l.duration > 0 ? `${Math.round(l.duration / 60)} min` : l.type}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {course.quizzes.length > 0 && (
          <div>
            <p className="bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quizzes & Exams</p>
            {course.quizzes.map((q) => (
              <Link key={q.id} href={`/quiz/${q.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted">
                <FileQuestion className="h-4 w-4 text-primary" />
                <span className="flex-1">{q.title}</span>
                <Badge variant="outline">{q.type.replace("_", " ")}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button>
          <Logo showText={false} />
          <span className="hidden truncate text-sm font-medium sm:block">{course.title}</span>
        </div>
        <Button variant="outline" size="sm" asChild><Link href="/dashboard/my-courses"><ChevronLeft className="h-4 w-4" /> Exit</Link></Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden w-80 shrink-0 border-r border-border lg:block">{Sidebar}</aside>

        {/* Sidebar mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute left-0 top-0 h-full w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <button className="absolute right-2 top-2 z-10 rounded p-1 text-muted-foreground" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
              {Sidebar}
            </div>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          {current && (
            <div className="mx-auto max-w-4xl p-4 sm:p-6">
              {/* Content viewer */}
              <div className="overflow-hidden rounded-xl border border-border bg-black">
                {current.type === "VIDEO" && current.videoUrl ? (
                  <div className="relative aspect-video">
                    <iframe
                      src={embedUrl(current)}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={current.title}
                    />
                  </div>
                ) : current.type === "PDF" && current.pdfUrl ? (
                  <iframe src={current.pdfUrl} className="h-[70vh] w-full bg-white" title={current.title} />
                ) : (
                  <div className="prose-content min-h-[40vh] bg-white p-6" dangerouslySetInnerHTML={{ __html: current.content || "<p>No content.</p>" }} />
                )}
              </div>

              {/* Controls */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">{current.title}</h1>
                  <p className="text-sm text-muted-foreground">Lesson {currentIndex + 1} of {flatLessons.length}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={toggleBookmark} title="Bookmark">
                    {bookmarkSet.includes(current.id) ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" disabled={currentIndex === flatLessons.length - 1} onClick={() => goTo(currentIndex + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  {progressMap[current.id]?.completed ? (
                    <Button variant="soft" disabled><CheckCircle2 className="h-4 w-4" /> Completed</Button>
                  ) : (
                    <Button onClick={markComplete}><CheckCircle2 className="h-4 w-4" /> Mark complete</Button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="notes" className="mt-6">
                <TabsList>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>
                <TabsContent value="notes">
                  <div className="space-y-3">
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note for this lesson…" rows={3} />
                    <Button size="sm" onClick={addNote} disabled={savingNote || !note.trim()}>Save note</Button>
                    <div className="space-y-2">
                      {notes.map((n) => (
                        <div key={n.id} className="rounded-lg border border-border bg-card p-3 text-sm">{n.content}</div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="overview">
                  <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                    {overall >= 100 ? (
                      <p className="flex items-center gap-2 text-primary"><Trophy className="h-4 w-4" /> You&apos;ve completed this course! Check your certificate in the dashboard.</p>
                    ) : (
                      <p>Keep going — complete all lessons to earn your certificate.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, PlayCircle, FileText, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Lesson { id: string; title: string; type: string; isPreview: boolean }
interface Section { id: string; title: string; lessons: Lesson[] }

export function CurriculumBuilder({ courseId, sections: initial }: { courseId: string; sections: Section[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [newSection, setNewSection] = useState("");

  async function addSection() {
    if (!newSection.trim()) return;
    const res = await fetch("/api/admin/sections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, title: newSection }) });
    const data = await res.json();
    if (res.ok) { setSections((s) => [...s, { id: data.data.id, title: data.data.title, lessons: [] }]); setNewSection(""); toast.success("Section added"); }
  }

  async function deleteSection(id: string) {
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    setSections((s) => s.filter((x) => x.id !== id));
    toast.success("Section removed");
  }

  async function deleteLesson(sectionId: string, lessonId: string) {
    await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
    setSections((s) => s.map((sec) => sec.id === sectionId ? { ...sec, lessons: sec.lessons.filter((l) => l.id !== lessonId) } : sec));
    router.refresh();
  }

  function onLessonAdded(sectionId: string, lesson: Lesson) {
    setSections((s) => s.map((sec) => sec.id === sectionId ? { ...sec, lessons: [...sec.lessons, lesson] } : sec));
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{section.title}</h3>
                <Badge variant="outline">{section.lessons.length} lessons</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteSection(section.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
            <div className="mt-3 space-y-2">
              {section.lessons.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                  {l.type === "VIDEO" ? <PlayCircle className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                  <span className="flex-1">{l.title}</span>
                  {l.isPreview && <Badge variant="soft">Preview</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => deleteLesson(section.id, l.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ))}
            </div>
            <AddLessonDialog sectionId={section.id} onAdded={(l) => onLessonAdded(section.id, l)} />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="flex items-center gap-2 p-4">
          <Input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="New section title" />
          <Button onClick={addSection}><Plus className="h-4 w-4" /> Add section</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AddLessonDialog({ sectionId, onAdded }: { sectionId: string; onAdded: (l: Lesson) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("VIDEO");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      sectionId, type,
      title: String(fd.get("title")),
      videoProvider: type === "VIDEO" ? "YOUTUBE" : null,
      videoUrl: type === "VIDEO" ? String(fd.get("videoUrl") || "") : null,
      content: type === "TEXT" ? String(fd.get("content") || "") : null,
      pdfUrl: type === "PDF" ? String(fd.get("pdfUrl") || "") : null,
      duration: Number(fd.get("duration") || 0) * 60,
      isPreview: fd.get("isPreview") === "on",
    };
    const res = await fetch("/api/admin/lessons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      onAdded({ id: data.data.id, title: data.data.title, type: data.data.type, isPreview: data.data.isPreview });
      setOpen(false);
      toast.success("Lesson added");
    } else toast.error(data.message || "Failed");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="mt-3"><Plus className="h-4 w-4" /> Add lesson</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add lesson</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["VIDEO", "PDF", "TEXT"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {type === "VIDEO" && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">YouTube embed URL</Label>
              <Input id="videoUrl" name="videoUrl" placeholder="https://www.youtube.com/embed/..." />
            </div>
          )}
          {type === "PDF" && (
            <div className="space-y-2">
              <Label htmlFor="pdfUrl">PDF URL</Label>
              <Input id="pdfUrl" name="pdfUrl" placeholder="https://…" />
            </div>
          )}
          {type === "TEXT" && (
            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML)</Label>
              <Textarea id="content" name="content" rows={4} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input id="duration" name="duration" type="number" min={0} defaultValue={5} />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input type="checkbox" name="isPreview" id="isPreview" className="h-4 w-4" />
              <Label htmlFor="isPreview">Free preview</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>Add lesson</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

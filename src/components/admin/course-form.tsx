"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Initial {
  id?: string;
  title?: string; subtitle?: string; description?: string; thumbnail?: string;
  price?: number; discountPrice?: number | null; isFree?: boolean;
  level?: string; language?: string; categoryId?: string | null; status?: string;
  learningOutcomes?: string[]; requirements?: string[];
}

export function CourseForm({ categories, initial }: { categories: { id: string; name: string }[]; initial?: Initial }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFree, setIsFree] = useState(initial?.isFree ?? false);
  const [level, setLevel] = useState(initial?.level ?? "ALL_LEVELS");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title")),
      subtitle: String(fd.get("subtitle") || ""),
      description: String(fd.get("description") || ""),
      thumbnail: String(fd.get("thumbnail") || ""),
      price: Number(fd.get("price") || 0),
      discountPrice: fd.get("discountPrice") ? Number(fd.get("discountPrice")) : null,
      isFree,
      level,
      language: String(fd.get("language") || "English"),
      categoryId: categoryId || null,
      status,
      learningOutcomes: String(fd.get("outcomes") || "").split("\n").map((s) => s.trim()).filter(Boolean),
      requirements: String(fd.get("requirements") || "").split("\n").map((s) => s.trim()).filter(Boolean),
    };

    const res = await fetch(initial?.id ? `/api/admin/courses/${initial.id}` : "/api/admin/courses", {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(data.message || "Save failed");
    toast.success(initial?.id ? "Course updated" : "Course created");
    if (!initial?.id && data.data?.id) router.push(`/admin/courses/${data.data.id}`);
    else router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required defaultValue={initial?.title} placeholder="e.g. Full-Stack Web Development" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" name="subtitle" defaultValue={initial?.subtitle} placeholder="Short tagline" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description (HTML allowed)</Label>
              <Textarea id="description" name="description" rows={4} defaultValue={initial?.description} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input id="thumbnail" name="thumbnail" defaultValue={initial?.thumbnail} placeholder="https://…" />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"].map((l) => <SelectItem key={l} value={l}>{l.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" name="language" defaultValue={initial?.language ?? "English"} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch checked={isFree} onCheckedChange={setIsFree} id="free" />
              <Label htmlFor="free">This is a free course</Label>
            </div>

            {!isFree && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input id="price" name="price" type="number" min={0} defaultValue={initial?.price ?? 0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Discounted price (₹)</Label>
                  <Input id="discountPrice" name="discountPrice" type="number" min={0} defaultValue={initial?.discountPrice ?? undefined} />
                </div>
              </>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="outcomes">Learning outcomes (one per line)</Label>
              <Textarea id="outcomes" name="outcomes" rows={3} defaultValue={initial?.learningOutcomes?.join("\n")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <Textarea id="requirements" name="requirements" rows={2} defaultValue={initial?.requirements?.join("\n")} />
            </div>
          </div>

          <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />} {initial?.id ? "Save changes" : "Create course"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

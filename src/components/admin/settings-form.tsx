"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const settings = [
      { key: "site.name", value: String(fd.get("name")), group: "general" },
      { key: "site.tagline", value: String(fd.get("tagline")), group: "general" },
      { key: "site.supportEmail", value: String(fd.get("supportEmail")), group: "general" },
      { key: "site.brandColor", value: String(fd.get("brandColor")), group: "appearance" },
    ];
    const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings }) });
    setLoading(false);
    if (res.ok) { toast.success("Settings saved"); router.refresh(); } else toast.error("Save failed");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="name">Site name</Label><Input id="name" name="name" defaultValue={initial["site.name"]} /></div>
      <div className="space-y-2"><Label htmlFor="tagline">Tagline</Label><Input id="tagline" name="tagline" defaultValue={initial["site.tagline"]} /></div>
      <div className="space-y-2"><Label htmlFor="supportEmail">Support email</Label><Input id="supportEmail" name="supportEmail" type="email" defaultValue={initial["site.supportEmail"]} /></div>
      <div className="space-y-2"><Label htmlFor="brandColor">Brand color</Label><Input id="brandColor" name="brandColor" type="text" defaultValue={initial["site.brandColor"] || "#15803d"} /></div>
      <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />} Save settings</Button>
    </form>
  );
}

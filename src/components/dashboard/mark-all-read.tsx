"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export function MarkAllRead() {
  const router = useRouter();
  async function markAll() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    router.refresh();
  }
  return (
    <Button variant="outline" size="sm" onClick={markAll}>
      <CheckCheck className="h-4 w-4" /> Mark all read
    </Button>
  );
}

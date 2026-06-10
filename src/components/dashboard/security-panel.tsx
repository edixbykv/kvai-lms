"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function SecurityPanel({ twoFactorEnabled, hasPassword }: { twoFactorEnabled: boolean; hasPassword: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [twoFA, setTwoFA] = useState(twoFactorEnabled);

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: String(fd.get("current") || ""), newPassword: String(fd.get("new")) }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { toast.success("Password updated"); (e.target as HTMLFormElement).reset(); }
    else toast.error(data.message || "Failed");
  }

  async function toggle2FA(value: boolean) {
    setTwoFA(value);
    const res = await fetch("/api/profile/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: value }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(value ? "Two-factor authentication enabled" : "Two-factor disabled");
      if (value && data.data?.code) toast.info(`Demo 2FA code: ${data.data.code}`, { duration: 8000 });
      router.refresh();
    } else { setTwoFA(!value); toast.error("Failed to update 2FA"); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input id="current" name="current" type="password" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input id="new" name="new" type="password" minLength={8} required />
            </div>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Two-factor authentication</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg bg-primary-soft p-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Extra account security</p>
              <p className="text-xs text-muted-foreground">Require a code at sign-in for added protection.</p>
            </div>
            <Switch checked={twoFA} onCheckedChange={toggle2FA} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

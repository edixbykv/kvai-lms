import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { SecurityPanel } from "@/components/dashboard/security-panel";
import { formatDate } from "@/lib/utils";
import { Monitor, Smartphone } from "lucide-react";

export const metadata = { title: "Profile & Security" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const [dbUser, sessions, loginHistory] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.session.findMany({ where: { userId: user.id, revoked: false }, orderBy: { lastActive: "desc" }, take: 10 }),
    prisma.loginHistory.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile & Security</h2>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="devices">Devices & Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle>Personal information</CardTitle></CardHeader>
            <CardContent>
              <ProfileForm
                initial={{ name: dbUser?.name ?? "", phone: dbUser?.phone ?? "", bio: dbUser?.bio ?? "" }}
                email={dbUser?.email ?? ""}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <SecurityPanel twoFactorEnabled={dbUser?.twoFactorEnabled ?? false} hasPassword={!!dbUser?.passwordHash} />
        </TabsContent>

        <TabsContent value="devices">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Active sessions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    {s.device === "Mobile" ? <Smartphone className="h-5 w-5 text-muted-foreground" /> : <Monitor className="h-5 w-5 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.browser} · {s.os}</p>
                      <p className="text-xs text-muted-foreground">{s.ipAddress} · active {formatDate(s.lastActive)}</p>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && <p className="text-sm text-muted-foreground">No active sessions.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Login history</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {loginHistory.map((h) => (
                  <div key={h.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <div>
                      <p className="text-sm">{h.device ?? "Unknown"} · {h.ipAddress}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(h.createdAt, { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Badge variant={h.success ? "success" : "destructive"}>{h.success ? "Success" : "Failed"}</Badge>
                  </div>
                ))}
                {loginHistory.length === 0 && <p className="text-sm text-muted-foreground">No login history.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

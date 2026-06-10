import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/settings-form";
import { Badge } from "@/components/ui/badge";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isEmailConfigured } from "@/lib/email";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rows = await prisma.setting.findMany();
  const initial: Record<string, string> = {};
  for (const r of rows) initial[r.key] = typeof r.value === "string" ? r.value : JSON.stringify(r.value);

  const googleConfigured = !!process.env.GOOGLE_CLIENT_ID;

  const integrations = [
    { name: "Razorpay (Payments)", ok: isRazorpayConfigured },
    { name: "Cloudinary (Storage)", ok: isCloudinaryConfigured },
    { name: "SMTP (Email)", ok: isEmailConfigured },
    { name: "Google OAuth", ok: googleConfigured },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent><SettingsForm initial={initial} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium">{i.name}</span>
                <Badge variant={i.ok ? "success" : "secondary"}>{i.ok ? "Connected" : "Not configured"}</Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Add the corresponding keys to your environment variables to enable each integration.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

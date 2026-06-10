import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";
import { MarkAllRead } from "@/components/dashboard/mark-all-read";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifs = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground">{unread} unread</p>
        </div>
        {unread > 0 && <MarkAllRead />}
      </div>
      {notifs.length === 0 ? (
        <Card className="p-12 text-center"><Bell className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 text-muted-foreground">No notifications yet.</p></Card>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <Card key={n.id} className={`p-4 ${!n.read ? "border-l-4 border-l-primary" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

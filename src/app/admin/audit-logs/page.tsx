import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Audit Logs" };
export const dynamic = "force-dynamic";

const catColor: Record<string, "default" | "soft" | "secondary" | "warning" | "info" | "destructive"> = {
  login: "info", course: "soft", role: "warning", certificate: "default", payment: "secondary", student: "secondary",
};

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p className="text-muted-foreground">A complete trail of important actions across the platform.</p>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-xs">{l.action}</TableCell>
                <TableCell><Badge variant={catColor[l.category] ?? "outline"}>{l.category}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{l.user?.name ?? "System"}</TableCell>
                <TableCell className="text-muted-foreground">{l.ipAddress ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(l.createdAt, { hour: "2-digit", minute: "2-digit" })}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No activity logged yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

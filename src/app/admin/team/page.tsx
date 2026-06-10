import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { InviteDialog } from "@/components/admin/invite-dialog";
import { StudentActions } from "@/components/admin/student-actions";
import { STAFF_ROLE_SLUGS } from "@/lib/rbac";
import { initials, formatDate } from "@/lib/utils";

export const metadata = { title: "Team & Admins" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const [team, roles] = await Promise.all([
    prisma.user.findMany({ where: { role: { slug: { in: STAFF_ROLE_SLUGS } } }, include: { role: true }, orderBy: { createdAt: "asc" } }),
    prisma.role.findMany({ where: { slug: { in: STAFF_ROLE_SLUGS } } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team & Admins</h2>
          <p className="text-muted-foreground">{team.length} member(s)</p>
        </div>
        <InviteDialog roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last login</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {team.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">{u.image && <AvatarImage src={u.image} />}<AvatarFallback>{initials(u.name)}</AvatarFallback></Avatar>
                    <div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="soft">{u.role?.name}</Badge></TableCell>
                <TableCell><Badge variant={u.status === "ACTIVE" ? "success" : "destructive"}>{u.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}</TableCell>
                <TableCell>{u.role?.slug !== "super-admin" && <StudentActions id={u.id} status={u.status} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

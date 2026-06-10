import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CertificateActions } from "@/components/admin/certificate-actions";
import { formatDate } from "@/lib/utils";
import { Award, ShieldCheck, ShieldX, ExternalLink } from "lucide-react";

export const metadata = { title: "Certificates" };
export const dynamic = "force-dynamic";

export default async function AdminCertificatesPage() {
  const [certs, total, revoked] = await Promise.all([
    prisma.certificate.findMany({ include: { user: true }, orderBy: { issuedAt: "desc" }, take: 100 }),
    prisma.certificate.count(),
    prisma.certificate.count({ where: { status: "REVOKED" } }),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Certificates</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Issued" value={total} icon={Award} accent="primary" />
        <StatCard label="Active" value={total - revoked} icon={ShieldCheck} accent="blue" />
        <StatCard label="Revoked" value={revoked} icon={ShieldX} accent="rose" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Certificate ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certs.map((c) => (
              <TableRow key={c.id}>
                <TableCell><p className="font-medium">{c.recipientName}</p><p className="text-xs text-muted-foreground">{c.user.email}</p></TableCell>
                <TableCell className="text-muted-foreground">{c.courseTitle}</TableCell>
                <TableCell className="font-mono text-xs">{c.certificateId}</TableCell>
                <TableCell><Badge variant={c.status === "REVOKED" ? "destructive" : "success"}>{c.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.issuedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" asChild><Link href={`/verify/${c.verificationCode}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button>
                    <CertificateActions id={c.id} status={c.status} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {certs.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No certificates issued yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

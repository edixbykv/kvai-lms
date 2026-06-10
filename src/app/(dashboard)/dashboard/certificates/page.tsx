import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Award, Download, ShieldCheck } from "lucide-react";

export const metadata = { title: "Certificates" };
export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const user = await requireUser();
  const certs = await prisma.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Certificates</h2>
        <p className="text-muted-foreground">Download and share your verifiable certificates.</p>
      </div>

      {certs.length === 0 ? (
        <Card className="p-12 text-center">
          <Award className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Complete a course to earn your first certificate.</p>
          <Button asChild className="mt-4"><Link href="/dashboard/my-courses">Go to my courses</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {certs.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary"><Award className="h-6 w-6" /></span>
                <Badge variant={c.status === "REVOKED" ? "destructive" : "success"}>{c.status}</Badge>
              </div>
              <h3 className="mt-3 font-semibold">{c.courseTitle}</h3>
              <p className="mt-1 text-sm text-muted-foreground">ID: {c.certificateId}</p>
              <p className="text-sm text-muted-foreground">Issued {formatDate(c.issuedAt)}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" asChild className="flex-1">
                  <a href={`/api/certificates/${c.id}/download`} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> Download</a>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/verify/${c.verificationCode}`}><ShieldCheck className="h-4 w-4" /> Verify</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

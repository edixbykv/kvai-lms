import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ShieldCheck, ShieldX, Award } from "lucide-react";

export const metadata = { title: "Certificate Verification" };

export default async function VerifyResultPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const decoded = decodeURIComponent(code);

  const certificate = await prisma.certificate.findFirst({
    where: { OR: [{ verificationCode: decoded }, { certificateId: decoded }] },
    include: { course: true },
  });

  const valid = certificate && certificate.status !== "REVOKED";

  return (
    <>
      <PageHero title="Certificate Verification" />
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {valid ? (
          <Card className="overflow-hidden">
            <div className="bg-primary px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8" />
                <div>
                  <p className="text-lg font-semibold">Valid Certificate</p>
                  <p className="text-sm text-green-50">This certificate is authentic and issued by KVAI LMS.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Award className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Awarded to</p>
                  <p className="text-xl font-bold">{certificate.recipientName}</p>
                </div>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Course", certificate.courseTitle],
                  ["Certificate ID", certificate.certificateId],
                  ["Issued on", formatDate(certificate.issuedAt)],
                  ["Status", certificate.status],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg border border-border p-3">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                    <dd className="mt-1 text-sm font-medium">{v as string}</dd>
                  </div>
                ))}
              </dl>
              {certificate.pdfUrl && (
                <Button asChild variant="outline" className="w-full">
                  <a href={certificate.pdfUrl} target="_blank" rel="noreferrer">View certificate PDF</a>
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <ShieldX className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">
              {certificate?.status === "REVOKED" ? "Certificate Revoked" : "Certificate Not Found"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {certificate?.status === "REVOKED"
                ? "This certificate has been revoked and is no longer valid."
                : "We couldn't find a certificate matching that code. Please double-check and try again."}
            </p>
            {certificate?.status === "REVOKED" && <Badge variant="destructive" className="mt-3">Revoked</Badge>}
            <Button asChild className="mt-6"><Link href="/verify">Try another code</Link></Button>
          </Card>
        )}
      </div>
    </>
  );
}

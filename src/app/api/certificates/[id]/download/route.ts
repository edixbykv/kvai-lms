import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { generateCertificatePdf } from "@/lib/certificate-pdf";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cert = await prisma.certificate.findUnique({ where: { id } });
  if (!cert) return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Owner or staff can download. Public can use verification page instead.
  const user = await getCurrentUser();
  const isOwner = user?.id === cert.userId;
  const isStaff = user?.permissions.includes("*") || user?.permissions.includes("certificate.generate");
  if (!isOwner && !isStaff) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  if (cert.status === "REVOKED") return NextResponse.json({ message: "Certificate revoked" }, { status: 410 });

  const bytes = await generateCertificatePdf({
    recipientName: cert.recipientName,
    courseTitle: cert.courseTitle,
    certificateId: cert.certificateId,
    verificationCode: cert.verificationCode,
    issuedAt: cert.issuedAt,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cert.certificateId}.pdf"`,
    },
  });
}

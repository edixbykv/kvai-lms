import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, created, fail, parseBody, permissionGuard } from "@/lib/api";
import { generateCertificateId, generateVerificationCode } from "@/lib/certificate";
import { audit, notify } from "@/lib/audit";

const schema = z.object({ userId: z.string(), courseId: z.string() });

export const POST = handler(async (req: NextRequest) => {
  const admin = await permissionGuard("certificate.generate");
  const { userId, courseId } = await parseBody(req, schema);

  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!user || !course) return fail(404, "User or course not found");

  const existing = await prisma.certificate.findFirst({ where: { userId, courseId, status: { not: "REVOKED" } } });
  if (existing) return fail(409, "An active certificate already exists for this student & course");

  const cert = await prisma.certificate.create({
    data: {
      certificateId: generateCertificateId(),
      verificationCode: generateVerificationCode(),
      userId, courseId,
      recipientName: user.name,
      courseTitle: course.title,
    },
  });
  await notify(userId, "CERTIFICATE", "Certificate issued 🏆", `A certificate for "${course.title}" has been issued to you.`, "/dashboard/certificates");
  await audit({ userId: admin.id, action: "certificate.generate", category: "certificate", entityId: cert.id });
  return created(cert);
});

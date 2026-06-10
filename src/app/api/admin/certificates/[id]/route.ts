import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody, permissionGuard } from "@/lib/api";
import { generateCertificateId } from "@/lib/certificate";
import { audit } from "@/lib/audit";

const schema = z.object({ action: z.enum(["revoke", "reissue"]) });

export const PATCH = handler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { action } = await parseBody(req, schema);

  if (action === "revoke") {
    await permissionGuard("certificate.generate");
    await prisma.certificate.update({ where: { id }, data: { status: "REVOKED" } });
    await audit({ action: "certificate.revoke", category: "certificate", entityId: id });
    return ok({ status: "REVOKED" });
  }

  // reissue → new certificate id, mark reissued
  await permissionGuard("certificate.reissue");
  const cert = await prisma.certificate.findUnique({ where: { id } });
  if (!cert) return fail(404, "Certificate not found");
  const updated = await prisma.certificate.update({
    where: { id },
    data: { certificateId: generateCertificateId(), status: "REISSUED", reissuedAt: new Date() },
  });
  await audit({ action: "certificate.reissue", category: "certificate", entityId: id });
  return ok({ status: "REISSUED", certificateId: updated.certificateId });
});

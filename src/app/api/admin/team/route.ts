import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { handler, created, fail, parseBody, permissionGuard } from "@/lib/api";
import { audit } from "@/lib/audit";
import { sendMail, baseEmailTemplate } from "@/lib/email";

const schema = z.object({ name: z.string().min(2), email: z.string().email(), roleId: z.string() });

export const POST = handler(async (req: NextRequest) => {
  const admin = await permissionGuard("admin.users");
  const { name, email, roleId } = await parseBody(req, schema);

  if (await prisma.user.findUnique({ where: { email } })) return fail(409, "A user with this email already exists");
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return fail(404, "Role not found");

  // Create with a temporary password; send a reset link to set their own
  const tempPassword = crypto.randomBytes(12).toString("hex");
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(tempPassword), status: "ACTIVE", roleId, invitedBy: admin.id, emailVerified: new Date() },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({ data: { userId: user.id, token, type: "PASSWORD_RESET", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await sendMail({
    to: email,
    subject: "You've been invited to KVAI LMS",
    html: baseEmailTemplate("You're invited!", `<p>You've been added as <strong>${role.name}</strong> on KVAI LMS. Set your password to get started.</p>`, { label: "Set password", url }),
    text: `Set your password: ${url}`,
  });

  await audit({ userId: admin.id, action: "team.invite", category: "system", entityId: user.id, metadata: { role: role.name } });
  return created({ id: user.id });
});

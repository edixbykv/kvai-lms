import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { handler, ok, fail, parseBody, getClientIp } from "@/lib/api";
import { registerSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth-session";
import { audit, notify } from "@/lib/audit";
import { sendMail, baseEmailTemplate } from "@/lib/email";

export const POST = handler(async (req: NextRequest) => {
  const data = await parseBody(req, registerSchema);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return fail(409, "An account with this email already exists");

  const studentRole = await prisma.role.findUnique({ where: { slug: "student" } });
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      status: "ACTIVE",
      roleId: studentRole?.id,
    },
  });

  // Link referral if provided
  if (data.referralCode) {
    const referral = await prisma.referral.findUnique({ where: { code: data.referralCode } });
    if (referral && !referral.refereeId) {
      await prisma.referral.update({ where: { id: referral.id }, data: { refereeId: user.id } });
    }
  }

  // Email verification token
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Verify your KVAI LMS account",
    html: baseEmailTemplate(
      "Welcome to KVAI LMS!",
      `<p>Hi ${user.name},</p><p>Thanks for joining. Please verify your email to unlock all features.</p>`,
      { label: "Verify Email", url: verifyUrl }
    ),
    text: `Verify your email: ${verifyUrl}`,
  });

  await notify(user.id, "SYSTEM", "Welcome to KVAI LMS 🎓", "Start exploring courses and begin your learning journey.");
  await audit({ userId: user.id, action: "auth.register", category: "login", ipAddress: getClientIp(req) });

  await createSession(
    { id: user.id, email: user.email, name: user.name, roleSlug: "student" },
    { ip: getClientIp(req), userAgent: req.headers.get("user-agent") }
  );

  return ok({ id: user.id, name: user.name, email: user.email });
});

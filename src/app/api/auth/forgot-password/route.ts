import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { handler, ok, parseBody } from "@/lib/api";
import { forgotSchema } from "@/lib/validations";
import { sendMail, baseEmailTemplate } from "@/lib/email";

export const POST = handler(async (req: NextRequest) => {
  const { email } = await parseBody(req, forgotSchema);
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid user enumeration
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your KVAI LMS password",
      html: baseEmailTemplate(
        "Password reset request",
        `<p>Hi ${user.name},</p><p>Click below to reset your password. This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
        { label: "Reset Password", url }
      ),
      text: `Reset your password: ${url}`,
    });
  }

  return ok({ message: "If an account exists, a reset link has been sent." });
});

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth-session";
import { getClientIp } from "@/lib/api";
import { audit, notify } from "@/lib/audit";

/**
 * Google OAuth callback — exchanges the code, finds/creates the user, sets session.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (!code) return NextResponse.redirect(new URL("/login?error=oauth_failed", base));

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return NextResponse.redirect(new URL("/login?error=oauth_token", base));

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.email) return NextResponse.redirect(new URL("/login?error=oauth_profile", base));

    let user = await prisma.user.findUnique({ where: { email: profile.email }, include: { role: true } });

    if (!user) {
      const studentRole = await prisma.role.findUnique({ where: { slug: "student" } });
      user = await prisma.user.create({
        data: {
          name: profile.name || profile.email.split("@")[0],
          email: profile.email,
          googleId: profile.id,
          image: profile.picture,
          emailVerified: new Date(),
          status: "ACTIVE",
          roleId: studentRole?.id,
        },
        include: { role: true },
      });
      await notify(user.id, "SYSTEM", "Welcome to KVAI LMS 🎓", "Your account is ready. Start learning today!");
    } else if (!user.googleId) {
      await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.id, image: user.image || profile.picture, emailVerified: user.emailVerified || new Date() } });
    }

    await createSession(
      { id: user.id, email: user.email, name: user.name, roleSlug: user.role?.slug },
      { ip: getClientIp(req), userAgent: req.headers.get("user-agent") }
    );
    await audit({ userId: user.id, action: "auth.login_google", category: "login", ipAddress: getClientIp(req) });

    return NextResponse.redirect(new URL("/dashboard", base));
  } catch (err) {
    console.error("[GOOGLE OAUTH]", err);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", base));
  }
}

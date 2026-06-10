import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));

  const item = await prisma.libraryItem.findUnique({ where: { id } });
  if (!item || !item.downloadable) return NextResponse.json({ message: "Not available" }, { status: 404 });

  await prisma.libraryItem.update({ where: { id }, data: { downloads: { increment: 1 } } });
  return NextResponse.redirect(item.url);
}

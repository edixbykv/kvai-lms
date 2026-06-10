import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, parseBody, permissionGuard } from "@/lib/api";
import { audit } from "@/lib/audit";

const schema = z.object({ settings: z.array(z.object({ key: z.string(), value: z.any(), group: z.string().optional() })) });

export const POST = handler(async (req: NextRequest) => {
  const admin = await permissionGuard("admin.settings");
  const { settings } = await parseBody(req, schema);
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group ?? "general" },
      create: { key: s.key, value: s.value, group: s.group ?? "general" },
    });
  }
  await audit({ userId: admin.id, action: "settings.update", category: "settings" });
  return ok({ saved: true });
});

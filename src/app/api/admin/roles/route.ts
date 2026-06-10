import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, ok, created, parseBody, permissionGuard } from "@/lib/api";
import { roleSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { nanoid } from "nanoid";

export const GET = handler(async () => {
  await permissionGuard("admin.roles");
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
    orderBy: { createdAt: "asc" },
  });
  return ok(roles);
});

export const POST = handler(async (req: NextRequest) => {
  const admin = await permissionGuard("admin.roles");
  const data = await parseBody(req, roleSchema);

  let slug = slugify(data.name);
  if (await prisma.role.findUnique({ where: { slug } })) slug = `${slug}-${nanoid(4)}`;

  const perms = await prisma.permission.findMany({ where: { key: { in: data.permissions } } });
  const role = await prisma.role.create({
    data: {
      name: data.name, slug, description: data.description, isSystem: false,
      permissions: { create: perms.map((p) => ({ permissionId: p.id })) },
    },
  });
  await audit({ userId: admin.id, action: "role.create", category: "role", entityId: role.id });
  return created(role);
});

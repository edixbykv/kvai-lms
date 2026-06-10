import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, parseBody, authGuard } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional(),
});

export const PATCH = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const data = await parseBody(req, schema);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name, phone: data.phone, bio: data.bio, image: data.image },
  });
  return ok({ id: updated.id, name: updated.name });
});

import { handler, ok, authGuard } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const POST = handler(async () => {
  const user = await authGuard();
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return ok({ done: true });
});

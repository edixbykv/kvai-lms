import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, ok, parseBody } from "@/lib/api";
import { leadSchema } from "@/lib/validations";

export const POST = handler(async (req: NextRequest) => {
  const data = await parseBody(req, leadSchema);
  const lead = await prisma.lead.create({ data });
  return ok({ id: lead.id });
});

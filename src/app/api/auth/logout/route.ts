import { handler, ok } from "@/lib/api";
import { clearSession } from "@/lib/auth-session";

export const POST = handler(async () => {
  await clearSession();
  return ok({ loggedOut: true });
});

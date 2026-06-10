import { NextResponse, NextRequest } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { getCurrentUser, CurrentUser } from "./session";
import { hasPermission } from "./rbac";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function fail(status: number, message: string, errors?: unknown) {
  return NextResponse.json({ success: false, message, errors }, { status });
}

/**
 * Wrap a route handler with standardized error handling.
 */
export function handler<T extends unknown[]>(
  fn: (req: NextRequest, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    try {
      return await fn(req, ...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(err.status, err.message);
      }
      if (err instanceof ZodError) {
        return fail(422, "Validation failed", err.flatten().fieldErrors);
      }
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        return fail(401, "Authentication required");
      }
      console.error("[API ERROR]", err);
      return fail(500, "Internal server error");
    }
  };
}

/** Require an authenticated user or throw 401. */
export async function authGuard(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Authentication required");
  return user;
}

/** Require a specific permission or throw 403. */
export async function permissionGuard(permission: string): Promise<CurrentUser> {
  const user = await authGuard();
  if (!hasPermission(user.permissions, permission)) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
  return user;
}

/** Parse + validate a JSON request body against a Zod schema. */
export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  return schema.parse(json);
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

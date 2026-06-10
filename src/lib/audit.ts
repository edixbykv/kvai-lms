import { prisma } from "./prisma";

export interface AuditEntry {
  userId?: string | null;
  action: string;
  category: "login" | "course" | "role" | "certificate" | "student" | "payment" | "content" | "settings" | "system";
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Record an audit-log entry. Never throws — logging must not break the flow.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        category: entry.category,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata as never,
        ipAddress: entry.ipAddress,
      },
    });
  } catch (err) {
    console.error("[AUDIT ERROR]", err);
  }
}

export async function notify(
  userId: string,
  type: "SYSTEM" | "COURSE" | "PAYMENT" | "CERTIFICATE" | "ANNOUNCEMENT" | "ASSIGNMENT",
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  } catch (err) {
    console.error("[NOTIFY ERROR]", err);
  }
}

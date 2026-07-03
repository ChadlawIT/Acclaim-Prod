import { db } from "./db";
import { auditLog } from "@shared/schema";
import { eq } from "drizzle-orm";

interface UserEmailTimestamps {
  welcomeSentAt?: string;
  inviteSentAt?: string;
  tempPasswordSentAt?: string;
}

type EmailTimestampsStore = Record<string, UserEmailTimestamps>;

const TABLE_NAME = "email_notifications";

export async function recordWelcomeEmail(userId: string): Promise<void> {
  try {
    await db.insert(auditLog).values({
      tableName: TABLE_NAME,
      recordId: userId,
      operation: "INSERT",
      fieldName: "welcomeSentAt",
      description: "Welcome email sent",
    });
  } catch (err) {
    console.error("[emailTracker] Failed to record welcome email:", err);
  }
}

export async function recordInviteEmail(userId: string): Promise<void> {
  try {
    await db.insert(auditLog).values({
      tableName: TABLE_NAME,
      recordId: userId,
      operation: "INSERT",
      fieldName: "inviteSentAt",
      description: "Microsoft invitation sent",
    });
  } catch (err) {
    console.error("[emailTracker] Failed to record invite email:", err);
  }
}

export async function recordTempPasswordEmail(userId: string): Promise<void> {
  try {
    await db.insert(auditLog).values({
      tableName: TABLE_NAME,
      recordId: userId,
      operation: "INSERT",
      fieldName: "tempPasswordSentAt",
      description: "Temporary password email sent",
    });
  } catch (err) {
    console.error("[emailTracker] Failed to record temp password email:", err);
  }
}

export async function getAllTimestamps(): Promise<EmailTimestampsStore> {
  try {
    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.tableName, TABLE_NAME))
      .orderBy(auditLog.timestamp);

    const store: EmailTimestampsStore = {};
    for (const row of rows) {
      if (!store[row.recordId]) store[row.recordId] = {};
      const ts = row.timestamp?.toISOString();
      if (!ts) continue;
      if (row.fieldName === "welcomeSentAt") {
        store[row.recordId].welcomeSentAt = ts;
      } else if (row.fieldName === "inviteSentAt") {
        store[row.recordId].inviteSentAt = ts;
      } else if (row.fieldName === "tempPasswordSentAt") {
        store[row.recordId].tempPasswordSentAt = ts;
      }
    }
    return store;
  } catch (err) {
    console.error("[emailTracker] Failed to read email timestamps:", err);
    return {};
  }
}

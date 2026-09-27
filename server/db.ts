import { and, desc, eq, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, Match, InsertReport, messages, matches, reports, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listReportsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.createdAt));
}

export async function listOppositeReports(type: "lost" | "found") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(and(eq(reports.type, type), eq(reports.status, "active"))).orderBy(desc(reports.createdAt));
}

export async function getReport(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result[0];
}

export async function getMatchesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const ownedReports = await db.select({ id: reports.id }).from(reports).where(eq(reports.userId, userId));
  const ids = ownedReports.map(item => item.id);
  if (!ids.length) return [];
  return db.select().from(matches).where(or(inArray(matches.lostReportId, ids), inArray(matches.foundReportId, ids))).orderBy(desc(matches.createdAt));
}

export async function getMessagesForMatch(matchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.matchId, matchId)).orderBy(messages.createdAt);
}

export async function deleteDemoForUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  const demoReports = await db.select({ id: reports.id }).from(reports).where(and(eq(reports.userId, userId), eq(reports.isDemo, 1)));
  const ids = demoReports.map(item => item.id);
  if (ids.length) {
    await db.delete(matches).where(or(inArray(matches.lostReportId, ids), inArray(matches.foundReportId, ids)));
    await db.delete(reports).where(and(eq(reports.userId, userId), eq(reports.isDemo, 1)));
  }
}

export type DbMatch = Match;
export type { InsertReport };

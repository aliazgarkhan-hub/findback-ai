import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { deleteDemoForUser, getDb, getMessagesForMatch, getReport, getMatchesForUser, listOppositeReports, listReportsForUser } from "./db";
import { reports, matches, messages } from "../drizzle/schema";
import { calculateMatch } from "./matching";
import { storagePut } from "./storage";

const reportInput = z.object({
  type: z.enum(["lost", "found"]),
  itemName: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(64),
  description: z.string().trim().min(12).max(2000),
  location: z.string().trim().min(2).max(180),
  eventAt: z.string().datetime(),
  brand: z.string().trim().max(120).optional().default(""),
  model: z.string().trim().max(120).optional().default(""),
  color: z.string().trim().max(80).optional().default(""),
  features: z.string().trim().max(1000).optional().default(""),
  identifier: z.string().trim().max(160).optional().default(""),
  imageUrl: z.string().min(1),
  imageKey: z.string().min(1),
  contactPreference: z.enum(["in_app", "email"]).default("in_app"),
  isDemo: z.boolean().default(false),
});

async function createMatchesFor(report: typeof reports.$inferSelect) {
  const db = await getDb();
  if (!db) return [];
  const opposite = await listOppositeReports(report.type === "lost" ? "found" : "lost");
  const created = [];
  for (const candidate of opposite) {
    if (candidate.id === report.id) continue;
    const lost = report.type === "lost" ? report : candidate;
    const found = report.type === "found" ? report : candidate;
    const result = calculateMatch(lost, found);
    if (result.score < 25) continue;
    const exists = await db.select().from(matches).where(and(eq(matches.lostReportId, lost.id), eq(matches.foundReportId, found.id))).limit(1);
    if (exists[0]) { created.push(exists[0]); continue; }
    const inserted = await db.insert(matches).values({
      lostReportId: lost.id,
      foundReportId: found.id,
      score: result.score,
      factors: JSON.stringify(result.factors),
      explanation: result.explanation,
      status: "possible",
    });
    const id = Number(inserted[0].insertId);
    const saved = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
    if (saved[0]) created.push(saved[0]);
  }
  return created;
}

async function assertMatchAccess(userId: number, matchId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const match = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
  const reportsForMatch = await db.select().from(reports).where(inArray(reports.id, [match[0].lostReportId, match[0].foundReportId]));
  if (!reportsForMatch.some(item => item.userId === userId)) throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this match" });
  return { db, match: match[0], reportsForMatch };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  reports: router({
    mine: protectedProcedure.query(({ ctx }) => listReportsForUser(ctx.user.id)),
    create: protectedProcedure.input(reportInput).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const inserted = await db.insert(reports).values({
        ...input,
        userId: ctx.user.id,
        eventAt: new Date(input.eventAt),
        brand: input.brand || null,
        model: input.model || null,
        color: input.color || null,
        features: input.features || null,
        identifier: input.identifier || null,
        isDemo: input.isDemo ? 1 : 0,
      });
      const id = Number(inserted[0].insertId);
      const report = await getReport(id);
      if (!report) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Report could not be created" });
      const generatedMatches = await createMatchesFor(report);
      return { report, matches: generatedMatches };
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "matched", "recovered", "closed"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const report = await getReport(input.id);
      if (!db || !report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      if (report.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own report" });
      await db.update(reports).set({ status: input.status }).where(eq(reports.id, input.id));
      return { success: true };
    }),
  }),
  media: router({
    upload: protectedProcedure.input(z.object({ dataUrl: z.string().min(30), fileName: z.string().min(1).max(160), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]) })).mutation(async ({ ctx, input }) => {
      const match = input.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a JPG, PNG, or WEBP image" });
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.byteLength > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Image must be smaller than 5 MB" });
      const safeName = input.fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-");
      const uploaded = await storagePut(`findback/${ctx.user.id}/${Date.now()}-${safeName}`, buffer, input.mimeType);
      return uploaded;
    }),
  }),
  matches: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const rawMatches = await getMatchesForUser(ctx.user.id);
      if (!db) return [];
      const reportIds = Array.from(new Set(rawMatches.flatMap(item => [item.lostReportId, item.foundReportId])));
      const reportRows = reportIds.length ? await db.select().from(reports).where(inArray(reports.id, reportIds)) : [];
      return rawMatches.map(item => ({
        ...item,
        factors: JSON.parse(item.factors),
        lost: reportRows.find(report => report.id === item.lostReportId) ?? null,
        found: reportRows.find(report => report.id === item.foundReportId) ?? null,
      })).filter(item => item.lost && item.found);
    }),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const access = await assertMatchAccess(ctx.user.id, input.id);
      const messagesForMatch = await getMessagesForMatch(input.id);
      const lost = access.reportsForMatch.find(item => item.id === access.match.lostReportId);
      const found = access.reportsForMatch.find(item => item.id === access.match.foundReportId);
      return { ...access.match, factors: JSON.parse(access.match.factors), lost, found, messages: messagesForMatch };
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["possible", "contacted", "not_match", "recovered"]) })).mutation(async ({ ctx, input }) => {
      const access = await assertMatchAccess(ctx.user.id, input.id);
      await access.db.update(matches).set({ status: input.status }).where(eq(matches.id, input.id));
      return { success: true };
    }),
  }),
  messages: router({
    send: protectedProcedure.input(z.object({ matchId: z.number().int().positive(), body: z.string().trim().min(2).max(1000) })).mutation(async ({ ctx, input }) => {
      const access = await assertMatchAccess(ctx.user.id, input.matchId);
      await access.db.insert(messages).values({ matchId: input.matchId, senderId: ctx.user.id, body: input.body.trim() });
      return { success: true };
    }),
    mine: protectedProcedure.input(z.object({ matchId: z.number().int().positive() })).query(({ ctx, input }) => assertMatchAccess(ctx.user.id, input.matchId).then(() => getMessagesForMatch(input.matchId))),
  }),
  demo: router({
    seed: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await deleteDemoForUser(ctx.user.id);
      const now = new Date();
      const sharedImage = { imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80", imageKey: "demo/lenovo-laptop.jpg" };
      const lost = await db.insert(reports).values({ userId: ctx.user.id, type: "lost", itemName: "Black Lenovo laptop", category: "Laptop", description: "Black Lenovo laptop with a small sticker near the corner and a silver charging port.", location: "Block B · Library entrance", eventAt: new Date(now.getTime() - 1000 * 60 * 60 * 18), brand: "Lenovo", model: "ThinkPad", color: "Black", features: "Small sticker near the corner; silver charging port", identifier: "", ...sharedImage, contactPreference: "in_app", status: "active", isDemo: 1 });
      const lostId = Number(lost[0].insertId);
      const found = await db.insert(reports).values({ userId: ctx.user.id, type: "found", itemName: "Black Lenovo laptop", category: "Laptop", description: "Black Lenovo laptop found with a sticker near the top-right corner and a silver charging port.", location: "Block B · Library help desk", eventAt: new Date(now.getTime() - 1000 * 60 * 60 * 5), brand: "Lenovo", model: "ThinkPad", color: "Black", features: "Sticker near top-right corner; silver charging port", identifier: "", ...sharedImage, contactPreference: "in_app", status: "active", isDemo: 1 });
      const foundId = Number(found[0].insertId);
      const lostReport = await getReport(lostId);
      if (lostReport) await createMatchesFor(lostReport);
      const foundReport = await getReport(foundId);
      if (foundReport) await createMatchesFor(foundReport);
      return { success: true, reportIds: [lostId, foundId] };
    }),
    clear: protectedProcedure.mutation(async ({ ctx }) => { await deleteDemoForUser(ctx.user.id); return { success: true }; }),
  }),
});

export type AppRouter = typeof appRouter;

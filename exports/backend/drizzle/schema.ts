import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["lost", "found"]).notNull(),
  itemName: varchar("itemName", { length: 160 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 180 }).notNull(),
  eventAt: timestamp("eventAt").notNull(),
  brand: varchar("brand", { length: 120 }),
  model: varchar("model", { length: 120 }),
  color: varchar("color", { length: 80 }),
  features: text("features"),
  identifier: varchar("identifier", { length: 160 }),
  imageUrl: varchar("imageUrl", { length: 520 }).notNull(),
  imageKey: varchar("imageKey", { length: 520 }).notNull(),
  contactPreference: varchar("contactPreference", { length: 32 }).default("in_app").notNull(),
  status: mysqlEnum("status", ["active", "matched", "recovered", "closed"]).default("active").notNull(),
  isDemo: int("isDemo").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  lostReportId: int("lostReportId").notNull(),
  foundReportId: int("foundReportId").notNull(),
  score: int("score").notNull(),
  factors: text("factors").notNull(),
  explanation: text("explanation").notNull(),
  status: mysqlEnum("status", ["possible", "contacted", "not_match", "recovered"]).default("possible").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  senderId: int("senderId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type Message = typeof messages.$inferSelect;

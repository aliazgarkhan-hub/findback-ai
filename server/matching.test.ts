import { describe, expect, it } from "vitest";
import { calculateMatch } from "./matching";
import type { Report } from "../drizzle/schema";

const base = { id: 1, userId: 1, itemName: "Black Lenovo laptop", category: "Laptop", description: "Black Lenovo laptop with a small sticker near the corner", location: "Block B Library", eventAt: new Date("2026-09-26T10:00:00Z"), brand: "Lenovo", model: "ThinkPad", color: "Black", features: "Small sticker near corner", identifier: null, imageUrl: "/image.jpg", imageKey: "image.jpg", contactPreference: "in_app", status: "active", isDemo: 0, createdAt: new Date(), updatedAt: new Date() } as Report;

describe("matching engine", () => {
  it("calculates a score from aligned report signals and explains the result", () => {
    const result = calculateMatch(base, { ...base, id: 2, userId: 2, description: "Black Lenovo laptop found with sticker near the corner", location: "Block B Library desk", eventAt: new Date("2026-09-26T17:00:00Z") });
    expect(result.score).toBeGreaterThan(70);
    expect(result.factors.find(factor => factor.key === "category")?.score).toBe(1);
    expect(result.explanation).toContain("match");
    expect(result.explanation).toContain("Visual comparison is not active");
  });

  it("does not punish missing optional fields with a zero score", () => {
    const result = calculateMatch({ ...base, brand: null, model: null, color: null, features: null }, { ...base, id: 2, userId: 2, brand: null, model: null, color: null, features: null });
    expect(result.factors.filter(factor => factor.score === null).length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
  });
});

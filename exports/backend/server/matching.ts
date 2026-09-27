import type { Report } from "../drizzle/schema";

export type FactorKey = "text" | "category" | "brandModel" | "color" | "features" | "location" | "date" | "image";

export type MatchFactor = {
  key: FactorKey;
  label: string;
  score: number | null;
  status: "exact" | "strong" | "moderate" | "weak" | "unavailable";
  detail: string;
  weight: number;
};

const WEIGHTS: Record<Exclude<FactorKey, "image">, number> = {
  text: 30,
  category: 15,
  brandModel: 15,
  color: 10,
  features: 15,
  location: 10,
  date: 5,
};

function clean(value?: string | null) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value?: string | null) {
  return new Set(clean(value).split(" ").filter(token => token.length > 2));
}

function overlap(a?: string | null, b?: string | null) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return null;
  let shared = 0;
  left.forEach(token => { if (right.has(token)) shared += 1; });
  return shared / Math.max(left.size, right.size);
}

function grade(score: number | null): MatchFactor["status"] {
  if (score === null) return "unavailable";
  if (score >= 0.95) return "exact";
  if (score >= 0.7) return "strong";
  if (score >= 0.45) return "moderate";
  return "weak";
}

function factor(key: FactorKey, label: string, score: number | null, detail: string, weight: number): MatchFactor {
  return { key, label, score, status: grade(score), detail, weight };
}

function compareValue(a?: string | null, b?: string | null, label = "Value", weight = 0) {
  const left = clean(a);
  const right = clean(b);
  if (!left || !right) return factor("brandModel", label, null, "Not provided on both reports", weight);
  if (left === right) return factor("brandModel", label, 1, `Both reports say ${a}`, weight);
  const similarity = overlap(left, right) ?? 0;
  return factor("brandModel", label, similarity, similarity >= 0.45 ? "The descriptions share identifying terms" : "No clear overlap", weight);
}

export function calculateMatch(lost: Report, found: Report) {
  const textScore = overlap(`${lost.itemName} ${lost.description}`, `${found.itemName} ${found.description}`);
  const categoryScore = clean(lost.category) && clean(found.category) ? (clean(lost.category) === clean(found.category) ? 1 : 0) : null;
  const brandScore = compareValue(lost.brand, found.brand, "Brand", WEIGHTS.brandModel);
  const modelScore = compareValue(lost.model, found.model, "Model", WEIGHTS.brandModel);
  const brandModelValues = [brandScore.score, modelScore.score].filter((value): value is number => value !== null);
  const brandModelScore = brandModelValues.length ? Math.max(...brandModelValues) : null;
  const colorScore = clean(lost.color) && clean(found.color) ? (clean(lost.color) === clean(found.color) ? 1 : (overlap(lost.color, found.color) ?? 0)) : null;
  const featuresScore = overlap(lost.features, found.features);
  const locationScore = overlap(lost.location, found.location) ?? (clean(lost.location) && clean(found.location) && clean(lost.location) === clean(found.location) ? 1 : null);
  const hours = Math.abs(new Date(lost.eventAt).getTime() - new Date(found.eventAt).getTime()) / 3600000;
  const dateScore = Number.isFinite(hours) ? (hours <= 24 ? 1 : hours <= 72 ? 0.8 : hours <= 168 ? 0.6 : hours <= 720 ? 0.3 : 0) : null;

  const factors: MatchFactor[] = [
    factor("text", "Description similarity", textScore, textScore === null ? "Not enough shared text" : `${Math.round(textScore * 100)}% shared descriptive terms`, WEIGHTS.text),
    factor("category", "Category", categoryScore, categoryScore === null ? "Category missing" : categoryScore === 1 ? "Same category" : "Different categories", WEIGHTS.category),
    factor("brandModel", "Brand / model", brandModelScore, brandModelScore === null ? "Brand or model not provided on both reports" : brandModelScore === 1 ? "Brand or model aligns exactly" : "Some brand/model overlap", WEIGHTS.brandModel),
    factor("color", "Color", colorScore, colorScore === null ? "Color not provided on both reports" : colorScore >= 0.95 ? "Same color" : "Similar color wording", WEIGHTS.color),
    factor("features", "Distinguishing features", featuresScore, featuresScore === null ? "No shared feature text to compare" : `${Math.round(featuresScore * 100)}% shared feature terms`, WEIGHTS.features),
    factor("location", "Location", locationScore, locationScore === null ? "Locations unavailable" : locationScore >= 0.7 ? "Nearby or matching location terms" : "Limited location overlap", WEIGHTS.location),
    factor("date", "Date / time", dateScore, dateScore === null ? "Date unavailable" : hours <= 24 ? "Reported within one day" : `Reports are ${Math.round(hours)} hours apart`, WEIGHTS.date),
    factor("image", "Image comparison", null, "Visual comparison is not active in this demo; score uses report details only", 0),
  ];

  const available = factors.filter(item => item.key !== "image" && item.score !== null);
  const weightTotal = available.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore = weightTotal ? available.reduce((sum, item) => sum + (item.score ?? 0) * item.weight, 0) / weightTotal : 0;
  const score = Math.round(weightedScore * 100);
  const positives = factors.filter(item => item.score !== null && item.score >= 0.55).map(item => item.detail).filter(Boolean);
  const explanation = positives.length
    ? `This may be a match because ${positives.slice(0, 4).join(", ").toLowerCase()}. ${factors.find(item => item.key === "image")?.detail}.`
    : `There are not enough aligned report details yet. ${factors.find(item => item.key === "image")?.detail}.`;

  return { score, factors, explanation };
}

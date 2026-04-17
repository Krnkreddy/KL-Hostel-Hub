const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function sanitizeSearchInput(input: string): string {
  return input.replace(/[,().\\%_]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

export function clampPaginationLimit(limit: number, max: number = 50): number {
  if (isNaN(limit) || limit < 1) return 10;
  return Math.min(limit, max);
}

export function clampPageNumber(page: number): number {
  if (isNaN(page) || page < 1) return 1;
  return Math.floor(page);
}

export function isValidRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function validateRatings(input: Record<string, unknown>) {
  const keys = ["overall", "cleanliness", "food_quality", "wifi_quality", "safety", "value_for_money", "management"] as const;
  const result: Record<string, number> = {};
  for (const key of keys) {
    if (!isValidRating(input[key])) return null;
    result[key] = input[key] as number;
  }
  return result as { overall: number; cleanliness: number; food_quality: number; wifi_quality: number; safety: number; value_for_money: number; management: number };
}

export function sanitizeRedirectPath(path: string | null): string {
  if (!path) return "/hostels";
  if (!path.startsWith("/") || path.startsWith("//")) return "/hostels";
  if (/^\/[a-z]+:/i.test(path)) return "/hostels";
  try {
    const decoded = decodeURIComponent(path);
    if (decoded.startsWith("//") || /^\/[a-z]+:/i.test(decoded)) return "/hostels";
  } catch { return "/hostels"; }
  return path;
}

export function sanitizeHostelPayload(body: Record<string, unknown>) {
  const allowed: Record<string, (v: unknown) => boolean> = {
    name: (v) => typeof v === "string" && v.length >= 2 && v.length <= 200,
    slug: (v) => typeof v === "string" && /^[a-z0-9-]+$/.test(v as string),
    description: (v) => typeof v === "string" && v.length <= 5000,
    address: (v) => typeof v === "string" && v.length <= 500,
    distance_from_campus: (v) => typeof v === "number" && v >= 0 && v <= 50,
    price_min: (v) => typeof v === "number" && Number.isInteger(v) && v >= 0,
    price_max: (v) => typeof v === "number" && Number.isInteger(v) && v >= 0,
    gender: (v) => typeof v === "string" && ["male", "female", "co-ed"].includes(v as string),
    contact_phone: (v) => v === null || (typeof v === "string" && v.length <= 20),
    contact_email: (v) => v === null || (typeof v === "string" && v.length <= 100),
    amenities: (v) => Array.isArray(v) && v.every((a) => typeof a === "string" && a.length <= 50),
    is_verified: (v) => typeof v === "boolean",
  };
  const sanitized: Record<string, unknown> = {};
  for (const [key, validator] of Object.entries(allowed)) {
    if (key in body && validator(body[key])) sanitized[key] = body[key];
  }
  return sanitized;
}

export async function detectFileType(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

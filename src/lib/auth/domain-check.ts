const ALLOWED_DOMAIN = "kluniversity.in";

// ✅ BUG-08 FIX: Use .pop() to get LAST segment after @, preventing multi-@ bypass
export function isAllowedDomain(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.split("@").pop()?.toLowerCase();
  return domain === ALLOWED_DOMAIN;
}

export function getDisplayNameFromEmail(email: string): string {
  return email.split("@")[0] || email;
}

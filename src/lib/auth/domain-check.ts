const ALLOWED_DOMAIN = "kluniversity.in";

export function isAllowedDomain(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return domain === ALLOWED_DOMAIN;
}

export function getDisplayNameFromEmail(email: string): string {
  return email.split("@")[0] || email;
}

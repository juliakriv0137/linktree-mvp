export function normalizeUsername(input: string): string {
  const v = input.trim().toLowerCase();
  return v.replace(/[^a-z0-9_]/g, "");
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

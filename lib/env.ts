declare global {
  interface Window {
    __LINKTREE_ENV__?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      SITE_URL?: string;
    };
  }
}

function required(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

const isBrowser = typeof window !== "undefined";

function readClientEnv() {
  if (!isBrowser) return undefined;
  return window.__LINKTREE_ENV__;
}

const fromWindow = readClientEnv();

export const env = {
  // Always available on client via window.__LINKTREE_ENV__
  SUPABASE_URL: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    (fromWindow?.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) || undefined
  ),

  SUPABASE_ANON_KEY: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    (fromWindow?.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || undefined
  ),

  NEXT_PUBLIC_SITE_URL:
    fromWindow?.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000",
};

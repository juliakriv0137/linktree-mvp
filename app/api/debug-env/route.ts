import { NextResponse } from "next/server";

function mask(v?: string | null) {
  if (!v) return null;
  const s = String(v);
  if (s.length <= 12) return s.slice(0, 3) + "…" + s.slice(-3);
  return s.slice(0, 8) + "…" + s.slice(-6) + " (len=" + s.length + ")";
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(key),
    hasUrl: Boolean(url),
    hasKey: Boolean(key),
  });
}

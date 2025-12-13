import { NextResponse } from "next/server";

function mask(s: string | undefined) {
  if (!s) return null;
  const str = String(s);
  if (str.length <= 12) return `${str.slice(0, 3)}...${str.slice(-3)}`;
  return `${str.slice(0, 10)}...${str.slice(-6)} (len=${str.length})`;
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        reason: "MISSING_ENV",
        hasUrl: !!url,
        hasKey: !!key,
        url: url ?? null,
        key: mask(key),
      },
      { status: 500 }
    );
  }

  try {
    const r = await fetch(`${url}/auth/v1/health`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    const text = await r.text();

    return NextResponse.json(
      {
        ok: r.ok,
        status: r.status,
        url,
        key: mask(key),
        body: text.slice(0, 200),
      },
      { status: r.ok ? 200 : 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, reason: "FETCH_FAILED", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}


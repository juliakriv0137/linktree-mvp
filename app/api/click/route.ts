import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const linkId = url.searchParams.get("link_id") ?? "";
  const to = url.searchParams.get("to") ?? "";

  // Basic validation
  if (!linkId || !to) {
    return NextResponse.redirect(new URL("/", env.NEXT_PUBLIC_SITE_URL), 302);
  }

  // Best-effort logging (do not block redirect on failures)
  try {
    const referrer = req.headers.get("referer");
    const ua = req.headers.get("user-agent");
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");

    await sb.from("click_events").insert({
      link_id: linkId,
      destination: to,
      referrer,
      user_agent: ua,
      ip,
    });
  } catch {
    // ignore
  }

  return NextResponse.redirect(to, 302);
}

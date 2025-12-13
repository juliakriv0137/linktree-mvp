"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function parseHashParams(hash: string) {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  const obj: Record<string, string> = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 1) Сначала проверим, нет ли ошибки в hash (#error=...)
        const hashObj = parseHashParams(window.location.hash || "");
        const err = hashObj.error || searchParams.get("error") || "";
        const errDesc =
          hashObj.error_description || searchParams.get("error_description") || "";

        if (err) {
          const msg = errDesc ? decodeURIComponent(errDesc.replace(/\+/g, " ")) : err;
          router.replace(`/login?error=${encodeURIComponent(msg)}`);
          return;
        }

        // 2) Дадим supabase-js обработать токены из URL (detectSessionInUrl=true)
        //    и сохраним сессию в storage
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        // Иногда нужно чуть подождать, чтобы состояние синхронизировалось
        // (особенно после перехода по magic link)
        if (!data.session) {
          // пробуем ещё раз коротко
          await new Promise((r) => setTimeout(r, 300));
          const retry = await supabase.auth.getSession();
          if (retry.error) throw retry.error;
        }

        if (cancelled) return;

        const next = searchParams.get("next") || "/dashboard";
        router.replace(next);
      } catch (e: any) {
        const msg = e?.message ?? "Auth callback failed";
        router.replace(`/login?error=${encodeURIComponent(msg)}`);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-center">
        <div className="text-lg font-semibold">Signing you in…</div>
        <div className="mt-2 text-sm text-zinc-400">
          Please wait, redirecting to your dashboard.
        </div>
      </div>
    </main>
  );
}

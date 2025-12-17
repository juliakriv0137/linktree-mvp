"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [status, setStatus] = useState<
    "init" | "setting_session" | "redirecting" | "error"
  >("init");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setStatus("init");

        // Supabase magic link (PKCE) обычно возвращает либо:
        // 1) код в query: ?code=...
        // 2) токены в hash: #access_token=...&refresh_token=...
        const code = searchParams.get("code");

        // Если есть code — Supabase сам обменяет его на сессию (PKCE).
        if (code) {
          setStatus("setting_session");
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) throw exchangeError;
        } else if (typeof window !== "undefined" && window.location.hash) {
          // Фоллбек для случаев, когда токены пришли в hash
          const hash = window.location.hash.replace(/^#/, "");
          const params = new URLSearchParams(hash);

          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            setStatus("setting_session");
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (setSessionError) throw setSessionError;
          }
        }

        setStatus("redirecting");
        router.replace("/dashboard");
      } catch (e: any) {
        setStatus("error");
        setError(e?.message ?? "Unknown error");
      }
    };

    run();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-white/10 bg-white/5 p-6" style={{ borderRadius: "var(--radius,15px)" }}>
        {status !== "error" ? (
          <>
            <div className="text-lg font-semibold">Signing you in…</div>
            <div className="mt-2 text-sm text-white/70">
              {status === "init" && "Initializing…"}
              {status === "setting_session" && "Creating session…"}
              {status === "redirecting" && "Redirecting to dashboard…"}
            </div>
          </>
        ) : (
          <>
            <div className="text-lg font-semibold text-red-400">
              Sign-in failed
            </div>
            <div className="mt-2 text-sm text-white/70 break-words">{error}</div>
            <button className="mt-4 inline-flex items-center justify-center border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15" style={{ borderRadius: "var(--radius,15px)" }} onClick={() => router.replace("/login")}
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}

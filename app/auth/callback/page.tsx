"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function parseHashTokens(hash: string) {
  // hash приходит вида: "#access_token=...&refresh_token=...&expires_in=..."
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);

  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  return { access_token, refresh_token };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<string>("Callback loaded (client).");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setStatus("Reading URL...");

        const code = searchParams.get("code");
        const hash = window.location.hash || "";
        const { access_token, refresh_token } = parseHashTokens(hash);

        setDetails({
          url: window.location.href,
          codePresent: Boolean(code),
          hashPresent: Boolean(hash),
          hasAccessToken: Boolean(access_token),
          hasRefreshToken: Boolean(refresh_token),
        });

        // 1) Если PKCE / code flow
        if (code) {
          setStatus("Exchanging code for session...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          setStatus("Session created via code exchange.");
          setDetails((prev: any) => ({ ...prev, session: data.session }));

          // подчистим URL от code
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("code");
          window.history.replaceState({}, document.title, cleanUrl.toString());

          router.replace("/dashboard");
          return;
        }

        // 2) Если implicit flow с токенами в hash
        if (access_token && refresh_token) {
          setStatus("Setting session from hash tokens...");
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;

          setStatus("Session created via setSession(hash tokens).");
          setDetails((prev: any) => ({ ...prev, session: data.session }));

          // подчистим hash, чтобы не оставлять токены в адресной строке
          if (window.location.hash) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname + window.location.search
            );
          }

          router.replace("/dashboard");
          return;
        }

        // 3) Если ничего не пришло — покажем сессию, вдруг она уже есть
        setStatus("No code/tokens in URL. Checking existing session...");
        const { data } = await supabase.auth.getSession();
        setDetails((prev: any) => ({ ...prev, existingSession: data.session }));

        if (data.session) {
          setStatus("Existing session found. Redirecting to /dashboard...");
          router.replace("/dashboard");
          return;
        }

        setStatus("No session. Redirecting to /login...");
        router.replace("/login");
      } catch (e: any) {
        console.error("Auth callback error:", e);
        setStatus("ERROR in callback. See details below.");
        setDetails((prev: any) => ({
          ...prev,
          error: {
            message: e?.message ?? String(e),
            name: e?.name,
            status: e?.status,
          },
        }));
      }
    };

    run();
  }, [router, searchParams, supabase]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Auth Callback</h1>
      <p className="mt-2 text-sm opacity-80">{status}</p>

      <pre className="mt-4 overflow-auto rounded-lg border p-4 text-xs">
        {JSON.stringify(details, null, 2)}
      </pre>
    </div>
  );
}

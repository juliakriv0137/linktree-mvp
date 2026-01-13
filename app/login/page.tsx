"use client";

import React from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { show, Toast } = useToast();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const origin = window.location.origin;
      const emailRedirectTo = `${origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      show("Magic link sent. Check your email.", "success");
    } catch (err: any) {
      show(err?.message ?? "Failed to send magic link", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen px-4 py-10 flex items-center justify-center"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(45, 212, 191, 0.20), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(56, 189, 248, 0.16), transparent 55%), #f7fafc",
      }}
    >
      {Toast}

      <div className="w-full max-w-md">
        <Card
          className="p-7 !bg-white !text-zinc-900 !border !border-zinc-200"
          style={{
            borderRadius: "28px",
            boxShadow:
              "0 30px 80px rgba(15, 23, 42, 0.12), 0 8px 24px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Login</h1>
              <p className="mt-2 text-sm text-zinc-600">
                Enter your email to receive a magic link.
              </p>
            </div>

            <span
              className="shrink-0 border px-3 py-1 text-xs font-semibold"
              style={{
                borderRadius: "999px",
                borderColor: "rgba(45, 212, 191, 0.35)",
                background: "rgba(45, 212, 191, 0.10)",
                color: "rgb(13, 148, 136)",
              }}
            >
              Magic link
            </span>
          </div>

          <form onSubmit={sendMagicLink} className="mt-6 space-y-4">
            {/* Input компонент может быть тёмным из-за dark-стилей.
                Мы оставляем его, но визуально вытягиваем через обёртку ниже. */}
            <div
              className="rounded-2xl"
              style={{
                borderRadius: "18px",
              }}
            >
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full !text-white"
              disabled={loading}
              style={{
                borderRadius: "18px",
                background: "rgb(45, 212, 191)",
              }}
            >
              {loading ? "Sending..." : "Send magic link"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-zinc-500">
            Tip: open the magic link on the same device/browser where you want to be logged in.
          </p>

          <div className="mt-6 text-sm">
            <Link href="/" className="text-zinc-600 hover:underline">
              ← Back to home
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

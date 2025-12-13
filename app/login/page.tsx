"use client";

import React from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { env } from "@/lib/env";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { show, Toast } = useToast();

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const redirectTo = `${env.NEXT_PUBLIC_SITE_URL}/dashboard`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
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
    <main className="mx-auto max-w-md px-4 py-10">
      {Toast}
      <Card className="p-7">
        <h1 className="text-xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your email to receive a magic link.
        </p>

        <form onSubmit={sendMagicLink} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send magic link"}
          </Button>
        </form>

        <div className="mt-6 text-sm">
          <Link href="/" className="text-zinc-600 hover:underline dark:text-zinc-400">
            ← Back to home
          </Link>
        </div>
      </Card>
    </main>
  );
}

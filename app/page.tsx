import Link from "next/link";
import { Card } from "@/components/Card";

export default function Home() {
  return (
    <main
      className="min-h-screen px-4 py-10"
      style={{
        background:
          "radial-gradient(900px 500px at 50% -10%, rgba(73, 205, 190, 0.14), rgba(255,255,255,0) 60%), var(--bg, #f6f7f9)",
        color: "var(--text, #111827)",
      }}
    >
      <div className="mx-auto max-w-3xl">
        <Card
          className="p-10"
          style={{
            borderRadius: "var(--radius, 20px)",
            background: "var(--card, #ffffff)",
            border: "1px solid var(--border, rgba(17, 24, 39, 0.10))",
            boxShadow:
              "0 24px 70px rgba(17, 24, 39, 0.10), 0 2px 8px rgba(17, 24, 39, 0.06)",
          }}
        >
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              NINEMAGS Page <span className="ml-2 align-middle text-xs font-semibold px-2 py-1 rounded-full"
                style={{
                  background: "rgba(73, 205, 190, 0.12)",
                  color: "rgba(20, 120, 110, 1)",
                  border: "1px solid rgba(73, 205, 190, 0.25)",
                }}
              >
                Beta
              </span>
            </h1>

            <p
              className="mx-auto mt-3 max-w-xl text-base"
              style={{ color: "var(--muted, rgba(17, 24, 39, 0.62))" }}
            >
              Create a clean link-in-bio page with blocks (links, text, images, products).
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-semibold transition"
                style={{
                  borderRadius: "var(--radius, 999px)",
                  background: "var(--primary, #49CDBE)", 
                  color: "var(--button-text, #ffffff)",
                  boxShadow: "0 10px 24px rgba(73, 205, 190, 0.28)",
                }}
              >
                Login
              </Link>

              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-semibold transition"
                style={{
                  borderRadius: "var(--radius, 999px)",
                  background: "var(--card, #ffffff)",
                  color: "var(--text, #111827)",
                  border: "1px solid var(--border, rgba(17, 24, 39, 0.14))",
                }}
              >
                Dashboard
              </Link>
            </div>

            <div className="mt-10">
              <div className="text-sm font-semibold" style={{ color: "var(--text, #111827)" }}>
                Your page URL
              </div>

              <div
                className="mx-auto mt-2 inline-flex items-center px-3 py-2 text-sm font-mono"
                style={{
                  borderRadius: "var(--radius, 999px)",
                  background: "rgba(17, 24, 39, 0.05)",
                  color: "var(--text, #111827)",
                  border: "1px solid rgba(17, 24, 39, 0.08)",
                }}
              >
                /your_username
              </div>

              <p className="mt-3 text-sm" style={{ color: "var(--muted, rgba(17, 24, 39, 0.62))" }}>
                Tip: share this link in your Instagram / TikTok bio.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

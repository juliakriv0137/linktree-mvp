"use client";

import * as React from "react";
import { createClient } from "@supabase/supabase-js";

type ProductRow = {
  id: string;
  site_id: string;

  title: string | null;
  description: string | null;
  image_url: string | null;

  price_cents: number | null;
  currency: string | null;

  product_url: string | null;
  slug: string | null;

  sort_order: number | null;
  is_published: boolean | null;

  created_at: string | null;
};

function formatPrice(priceCents: number | null, currency: string | null) {
  if (priceCents == null) return "";
  const amount = priceCents / 100;

  // Intl.NumberFormat может кинуть ошибку на "левую" валюту — страхуемся.
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    const cur = (currency || "USD").toUpperCase();
    return `${amount.toFixed(amount % 1 === 0 ? 0 : 2)} ${cur}`;
  }
}

function safeText(v: any) {
  const s = String(v ?? "").trim();
  return s;
}

function clampText(s: string, max = 140) {
  const t = safeText(s);
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function isValidHttpUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(raw: any) {
  const v = safeText(raw);
  if (!v) return "";
  if (v.startsWith("/")) return v; // локальная ссылка тоже ок
  if (v.startsWith("#")) return v;
  if (!/^https?:\/\//i.test(v)) return "https://" + v;
  return v;
}

function makeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Не ломаем рендер, просто дадим понятную ошибку в UI.
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, anon);
}

export type ProductsBlockProps = {
  siteId: string;
  title?: string | null;
  subtitle?: string | null;

  // на будущее — можно расширить: columns, showPrice, etc.
  className?: string;
};

export default function ProductsBlock(props: ProductsBlockProps) {
  const { siteId, title, subtitle, className } = props;
  console.log("[ProductsBlock] render", { siteId, title, subtitle });

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [products, setProducts] = React.useState<ProductRow[]>([]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = makeSupabaseClient();

        const { data, error } = await supabase
          .from("products")
          .select(
            "id,site_id,title,description,image_url,price_cents,currency,product_url,slug,sort_order,is_published,created_at"
          )
          .eq("site_id", siteId)
          .eq("is_published", true)
          .order("sort_order", { ascending: true, nullsFirst: true })
          .order("created_at", { ascending: false, nullsFirst: true })
          .limit(60);

        if (!alive) return;

        if (error) {
          setError(error.message || "Failed to load products");
          setProducts([]);
          return;
        }

        setProducts((data || []) as ProductRow[]);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load products");
        setProducts([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [siteId]);

  const headingTitle = safeText(title) || "Products";
  const headingSubtitle = safeText(subtitle);

  return (
    <section className={className}>
      <div
        style={{
          width: "100%",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          background: "var(--card, transparent)",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          <div
            style={{
              fontSize: "var(--text-h2-size, 22px)",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.15,
              overflowWrap: "anywhere",
            }}
          >
            {headingTitle}
          </div>

          {headingSubtitle ? (
            <div
              style={{
                fontSize: "var(--text-body-size, 14px)",
                color: "var(--muted)",
                lineHeight: 1.45,
                overflowWrap: "anywhere",
              }}
            >
              {headingSubtitle}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Loading products…</div>
        ) : error ? (
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>Couldn’t load products</div>
            <div style={{ marginTop: 6 }}>{error}</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 14 }}>No products yet.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {products.map((p) => {
              const rawUrl = normalizeUrl(p.product_url);
              const urlOk = rawUrl && (rawUrl.startsWith("/") || isValidHttpUrl(rawUrl));

              const price = formatPrice(p.price_cents, p.currency);
              const desc = clampText(p.description || "", 140);

              return (
                <article
                  key={p.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    background: "var(--card, transparent)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  {p.image_url ? (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "4 / 3",
                        background: "var(--muted-bg, rgba(0,0,0,0.03))",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={p.image_url}
                        alt={safeText(p.title) || "Product image"}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  ) : null}

                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--text)",
                          lineHeight: 1.2,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {safeText(p.title) || "Untitled product"}
                      </div>

                      {price ? (
                        <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.2 }}>
                          {price}
                        </div>
                      ) : null}
                    </div>

                    {desc ? (
                      <div
                        style={{
                          fontSize: 14,
                          color: "var(--muted)",
                          lineHeight: 1.45,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {desc}
                      </div>
                    ) : null}

                    {urlOk ? (
                      <a
                        href={rawUrl}
                        target={rawUrl.startsWith("/") || rawUrl.startsWith("#") ? undefined : "_blank"}
                        rel={rawUrl.startsWith("/") || rawUrl.startsWith("#") ? undefined : "noreferrer"}
                        style={{
                          marginTop: 6,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "10px 12px",
                          borderRadius: "calc(var(--radius) - 4px)",
                          border: "1px solid var(--border)",
                          background: "var(--primary)",
                          color: "var(--button-text, #fff)",
                          fontSize: "var(--text-button-size, 14px)",
                          fontWeight: "var(--text-button-weight, 600)",
                          textDecoration: "none",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        View product
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

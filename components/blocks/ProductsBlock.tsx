"use client";

import * as React from "react";
import { createClient } from "@supabase/supabase-js";

type ProductRow = {
    id: string;
    site_id: string;

    title: string | null;
    subtitle: string | null;
    description: string | null;
    image_url: string | null;

    external_url: string | null;

    currency: string | null;
    price_cents: number | null;
    compare_at_cents: number | null;

    is_active: boolean | null;
    sort_order: number | null;

    created_at: string | null;
    updated_at: string | null;
  };

function formatPrice(priceCents: number | null, currency: string | null) {
  if (priceCents == null) return "";
  const amount = priceCents / 100;

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
  return String(v ?? "").trim();
}

function clampText(s: string, max = 140) {
  const t = safeText(s);
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function normalizeUrl(raw: any) {
  const v = safeText(raw);
  if (!v) return "";
  if (v.startsWith("/")) return v;
  if (v.startsWith("#")) return v;
  if (/^(mailto:|tel:|sms:)/i.test(v)) return v;
  if (!/^https?:\/\//i.test(v)) return "https://" + v;
  return v;
}

function makeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, anon);
}

export type ProductsBlockProps = {
  siteId: string;
  title?: string | null;
  subtitle?: string | null;
  className?: string;

  // базовые опции на будущее
  limit?: number;
  columns?: 1 | 2 | 3;
};

export default function ProductsBlock(props: ProductsBlockProps) {
  const { siteId, title, subtitle, className, limit = 60, columns = 2 } = props;

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
          .select("id,site_id,title,subtitle,description,image_url,external_url,currency,price_cents,compare_at_cents,is_active,sort_order,created_at,updated_at")
          .eq("site_id", siteId)
          .eq("is_active", true)
          .order("sort_order", { ascending: true, nullsFirst: true })
            .order("updated_at", { ascending: false, nullsFirst: true })
            .limit(limit);

        if (!alive) return;

        if (error) {
          setError(error.message || "Couldn’t load products");
          setProducts([]);
          return;
        }

        setProducts((data ?? []) as ProductRow[]);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Couldn’t load products");
        setProducts([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [siteId, limit]);

  const gridColsClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  const blockTitle = safeText(title) || "Products";
  const blockSubtitle = clampText(subtitle || "", 200);

  return (
    <div className={className ? className : "w-full"}>
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-[rgb(var(--text))]">{blockTitle}</div>
          {blockSubtitle ? (
            <div className="mt-2 text-base text-[rgb(var(--muted))]">{blockSubtitle}</div>
          ) : null}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="text-center text-sm text-[rgb(var(--muted))]">Loading products…</div>
          ) : error ? (
            <div className="text-center">
              <div className="text-base font-semibold text-[rgb(var(--text))]">Couldn’t load products</div>
              <div className="mt-1 text-sm text-[rgb(var(--muted))]">{error}</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-sm text-[rgb(var(--muted))]">
              No active products yet.
            </div>
          ) : (
            <div className={`grid ${gridColsClass} gap-4`}>
              {products.map((p) => {
                const titleText = safeText(p.title) || "Untitled";
                const descText = clampText(p.description || p.subtitle || "", 140);
                const priceText = formatPrice(p.price_cents, p.currency);
                const img = safeText(p.image_url);
                const href = normalizeUrl(p.external_url);

                return (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-white/70"
                    style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}
                  >
                    {img ? (
                      <div className="relative w-full" style={{ aspectRatio: "4 / 3" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={normalizeUrl(img)}
                          alt={titleText}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center bg-black/5 text-xs text-[rgb(var(--muted))]"
                        style={{ aspectRatio: "4 / 3" }}
                      >
                        No image
                      </div>
                    )}

                    <div className="p-4">
                    <div className="text-base font-semibold text-[rgb(var(--text))] break-words" style={{ overflowWrap: "anywhere" }}>
  {titleText}
</div>


                      {priceText ? (
                        <div className="mt-1 text-sm font-medium text-[rgb(var(--text))]">{priceText}</div>
                      ) : null}

                      {descText ? (
                        <div
                        className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))] break-words"
                        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                      >
                        {descText}
                      </div>
                      
                      ) : null}

                      {href ? (
                        <div className="mt-4">
                          <a
                            href={href}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-2 text-sm font-semibold text-[rgb(var(--text))] hover:bg-black/5"
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            View product
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* маленькая подсказка для отладки (можно убрать потом) */}
        {!loading && !error ? (
          <div className="mt-4 text-center text-xs text-[rgb(var(--muted))]">
            Showing {products.length} active product(s).
          </div>
        ) : null}
      </div>
    </div>
  );
}

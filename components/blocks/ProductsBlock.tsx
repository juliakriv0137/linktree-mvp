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

  currency: string | null;
  price_cents: number | null;
  compare_at_cents: number | null;

  external_url: string | null;

  sort_order: number | null;
  is_active: boolean | null;

  created_at: string | null;
};

export type ProductsContent = {
  title?: string | null;
  subtitle?: string | null;

  layout?: "grid" | "list";
  columns?: 1 | 2 | 3;
  limit?: number;

  show_price?: boolean;
  show_description?: boolean;
  description_max_chars?: number;

  show_button?: boolean;
  button_label?: string | null;
  open_in_new_tab?: boolean;

  image_ratio?: "4/3" | "1/1" | "16/9" | "3/4";
  image_fit?: "cover" | "contain";

  header_align?: "left" | "center" | "right";
};

function safeText(v: any) {
  return String(v ?? "").trim();
}

function clampText(s: any, max = 140) {
  const t = safeText(s);
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

function clampNumber(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
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

function makeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, anon);
}

function ratioStyle(r: ProductsContent["image_ratio"]) {
  if (r === "1/1") return { aspectRatio: "1 / 1" as any };
  if (r === "16/9") return { aspectRatio: "16 / 9" as any };
  if (r === "3/4") return { aspectRatio: "3 / 4" as any };
  return { aspectRatio: "4 / 3" as any };
}

function headerAlignClass(a: ProductsContent["header_align"]) {
  if (a === "left") return "text-left";
  if (a === "right") return "text-right";
  return "text-center";
}

function LineClamp({
  text,
  lines,
  className,
}: {
  text: string;
  lines: number;
  className?: string;
}) {
  // без tailwind line-clamp plugin — делаем inline clamp
  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical" as any,
        WebkitLineClamp: lines as any,
      }}
    >
      {text}
    </div>
  );
}

export type ProductsBlockProps = {
  siteId: string;
  content?: ProductsContent | null;
  className?: string;
};

export default function ProductsBlock(props: ProductsBlockProps) {
  const { siteId, className } = props;

  const cfg: ProductsContent = props.content ?? {};

  const blockTitle = safeText(cfg.title) || "Products";
  const blockSubtitle = clampText(cfg.subtitle || "", 200);

  const layout: "grid" | "list" = cfg.layout === "list" ? "list" : "grid";
  const columns: 1 | 2 | 3 =
    cfg.columns === 1 || cfg.columns === 2 || cfg.columns === 3 ? cfg.columns : 2;
  const limit = clampNumber(cfg.limit, 1, 200, 60);

  const showPrice = cfg.show_price !== false;
  const showDescription = cfg.show_description !== false;
  const descMax = clampNumber(cfg.description_max_chars, 20, 500, 140);

  const showButton = cfg.show_button !== false;
  const buttonLabel = safeText(cfg.button_label) || "View product";
  const openInNewTab = Boolean(cfg.open_in_new_tab);

  const imageRatio = (cfg.image_ratio as any) || "4/3";
  const imageFit: "cover" | "contain" = cfg.image_fit === "contain" ? "contain" : "cover";
  const headerAlign = (cfg.header_align as any) || "center";

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
            "id,site_id,title,subtitle,description,image_url,currency,price_cents,compare_at_cents,external_url,sort_order,is_active,created_at",
          )
          .eq("site_id", siteId)
          .eq("is_active", true)
          .order("sort_order", { ascending: true, nullsFirst: true })
          .order("created_at", { ascending: false, nullsFirst: true })
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
    layout === "list"
      ? "grid-cols-1"
      : columns === 1
        ? "grid-cols-1"
        : columns === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={className ? className : "w-full"}>
      <div className="mx-auto w-full max-w-5xl">
        <div className={headerAlignClass(headerAlign)}>
          <div className="text-3xl font-bold text-[rgb(var(--text))] break-words">
            {blockTitle}
          </div>
          {blockSubtitle ? (
            <div className="mt-2 text-base text-[rgb(var(--muted))] break-words">
              {blockSubtitle}
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="text-center text-sm text-[rgb(var(--muted))]">Loading products…</div>
          ) : error ? (
            <div className="text-center">
              <div className="text-base font-semibold text-[rgb(var(--text))]">
                Couldn’t load products
              </div>
              <div className="mt-1 text-sm text-[rgb(var(--muted))] break-words">{error}</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-sm text-[rgb(var(--muted))]">
              No active products yet.
            </div>
          ) : (
            <div className={`grid ${gridColsClass} gap-4`}>
              {products.map((p) => {
                const titleText = safeText(p.title) || "Untitled";
                const subtitleText = safeText(p.subtitle);
                const descText = showDescription ? clampText(p.description || "", descMax) : "";
                const priceText = showPrice ? formatPrice(p.price_cents, p.currency) : "";
                const img = safeText(p.image_url);
                const href = normalizeUrl(p.external_url);

                return (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-white/70"
                    style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}
                  >
                    {img ? (
                      <div className="relative w-full" style={ratioStyle(imageRatio)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={normalizeUrl(img)}
                          alt={titleText}
                          className="absolute inset-0 h-full w-full"
                          style={{ objectFit: imageFit }}
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center bg-black/5 text-xs text-[rgb(var(--muted))]"
                        style={ratioStyle(imageRatio)}
                      >
                        No image
                      </div>
                    )}

                    <div className="p-4">
                      <div className="text-base font-semibold text-[rgb(var(--text))] break-words">
                        {titleText}
                      </div>

                      {subtitleText ? (
                        <div className="mt-1 text-sm text-[rgb(var(--muted))] break-words">
                          {subtitleText}
                        </div>
                      ) : null}

                      {priceText ? (
                        <div className="mt-2 text-sm font-medium text-[rgb(var(--text))]">
                          {priceText}
                        </div>
                      ) : null}

                      {descText ? (
                        <LineClamp
                          text={descText}
                          lines={layout === "list" ? 4 : 3}
                          className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))] break-words"
                        />
                      ) : null}

                      {showButton && href ? (
                        <div className="mt-4">
                          <a
                            href={href}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-2 text-sm font-semibold text-[rgb(var(--text))] hover:bg-black/5"
                            rel="noopener noreferrer"
                            target={openInNewTab ? "_blank" : undefined}
                          >
                            {buttonLabel}
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
      </div>
    </div>
  );
}

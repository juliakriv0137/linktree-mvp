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

  // ✅ NEW: sizing
  grid_max_width?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  card_size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  gap?: 2 | 3 | 4 | 5 | 6 | 8;
  card_padding?: "sm" | "md" | "lg";
  image_radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
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

function gridMaxWidthClass(v: ProductsContent["grid_max_width"]) {
  const s = String(v ?? "lg").toLowerCase();
  if (s === "full") return "w-full";
  if (s === "sm") return "mx-auto w-full max-w-2xl";
  if (s === "md") return "mx-auto w-full max-w-3xl";
  if (s === "xl") return "mx-auto w-full max-w-6xl";
  if (s === "2xl") return "mx-auto w-full max-w-7xl";
  // lg default
  return "mx-auto w-full max-w-5xl";
}

function cardMaxWidthClass(v: ProductsContent["card_size"]) {
  const s = String(v ?? "md").toLowerCase();
  if (s === "xs") return "max-w-xs";
  if (s === "sm") return "max-w-sm";
  if (s === "lg") return "max-w-lg";
  if (s === "xl") return "max-w-xl";
  if (s === "2xl") return "max-w-2xl";
  return "max-w-md"; // md default
}

function gapClass(v: ProductsContent["gap"]) {
  const n = Number(v);
  if (n === 2) return "gap-2";
  if (n === 3) return "gap-3";
  if (n === 5) return "gap-5";
  if (n === 6) return "gap-6";
  if (n === 8) return "gap-8";
  return "gap-4";
}

function cardPaddingClass(v: ProductsContent["card_padding"]) {
  const s = String(v ?? "md").toLowerCase();
  if (s === "sm") return "p-3";
  if (s === "lg") return "p-6";
  return "p-4";
}

function radiusValue(v: ProductsContent["image_radius"]): string {
  const s = String(v ?? "2xl").toLowerCase();
  if (s === "none") return "0px";
  if (s === "sm") return "12px";
  if (s === "md") return "16px";
  if (s === "lg") return "20px";
  if (s === "xl") return "24px";
  if (s === "full") return "9999px";
  return "32px"; // 2xl default
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

  // ✅ NEW defaults
  const gridMaxW = (cfg.grid_max_width as any) || "lg";
  const cardSize = (cfg.card_size as any) || "md";
  const gap = (cfg.gap as any) || 4;
  const cardPad = (cfg.card_padding as any) || "md";
  const imgRadius = (cfg.image_radius as any) || "2xl";

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

  const cardMaxWClass = cardMaxWidthClass(cardSize);
  const gridGapClass = gapClass(gap);
  const containerMaxWClass = gridMaxWidthClass(gridMaxW);

  return (
    <div className={className ? className : "w-full"}>
      <div className={containerMaxWClass}>
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
            <div className={`grid ${gridColsClass} ${gridGapClass} justify-items-center`}>
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
                    className={`w-full ${cardMaxWClass} overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-white/70`}
                    style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}
                  >
                    {img ? (
                      <div
                        className="relative w-full overflow-hidden"
                        style={{
                          ...ratioStyle(imageRatio),
                          borderTopLeftRadius: "16px",
                          borderTopRightRadius: "16px",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={normalizeUrl(img)}
                          alt={titleText}
                          className="absolute inset-0 h-full w-full"
                          style={{ objectFit: imageFit, borderRadius: radiusValue(imgRadius) }}
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

                    <div className={cardPaddingClass(cardPad)}>
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

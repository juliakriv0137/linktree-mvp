"use client";

import * as React from "react";

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function normalizeUrl(raw: any) {
  const v = safeTrim(raw);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v) && !v.startsWith("#") && !v.startsWith("/")) return `https://${v}`;
  return v;
}

function normalizeHex(v: any) {
  const s = safeTrim(v);
  if (!s) return "";
  const x = s.startsWith("#") ? s : `#${s}`;
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(x) ? x : "";
}

function normalizeRadiusValue(radiusRaw: any): string {
  // number -> px
  if (typeof radiusRaw === "number") return `${radiusRaw}px`;

  const raw = String(radiusRaw ?? "").trim();
  if (!raw) return "24px"; // default like rounded-2xl

  const low = raw.toLowerCase();

  // direct css length / var()
  if (raw.startsWith("var(")) return raw;
  if (/^(0|0px|\d+(\.\d+)?(px|rem|em|%|vh|vw))$/.test(low)) return raw;

  // tokens
  switch (low) {
    case "none":
      return "0px";
    case "sm":
      return "12px";
    case "md":
      return "16px";
    case "lg":
      return "20px";
    case "xl":
      return "24px";
    case "2xl":
      return "32px";
    case "full":
      return "9999px";
    default:
      return "24px";
  }
}

export type HeaderLinkItem = {
  label: string;
  url: string;
};

export type HeaderStyle = {
  text_color?: string | null;
  link_color?: string | null;
  bg_color?: string | null;

  radius?: string | number | null;

  brand_size?: "sm" | "md" | "lg" | null;
  links_size?: "sm" | "md" | "lg" | null;

  logo_size?: "sm" | "md" | "lg" | null;

  cta_bg_color?: string | null;
  cta_text_color?: string | null;
  cta_border_color?: string | null;
};

export function HeaderBlockClient(props: {
  variant?: "default" | "centered" | string;
  brandText: string;
  brandUrl?: string;
  logoUrl?: string;
  items: HeaderLinkItem[];
  hasCta: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
  style?: HeaderStyle | null;
}) {
  const variant = String(props.variant ?? "default");

  const brandText = safeTrim(props.brandText || "My Site");
  const brandUrl = normalizeUrl(props.brandUrl || "");
  const logoUrl = safeTrim(props.logoUrl || "");

  const items = Array.isArray(props.items) ? props.items : [];
  const hasCta = Boolean(props.hasCta);
  const ctaLabel = safeTrim(props.ctaLabel || "");
  const ctaUrl = normalizeUrl(props.ctaUrl || "");

  const style = (props.style ?? {}) as HeaderStyle;

  const hdrText = normalizeHex(style.text_color);
  const hdrLink = normalizeHex(style.link_color);
  const hdrBg = normalizeHex(style.bg_color);

  const ctaBg = normalizeHex(style.cta_bg_color);
  const ctaText = normalizeHex(style.cta_text_color);
  const ctaBorder = normalizeHex(style.cta_border_color);

  const brandSize = (style.brand_size ?? "md") as "sm" | "md" | "lg";
  const linksSize = (style.links_size ?? "md") as "sm" | "md" | "lg";
  const logoSize = (style.logo_size ?? "md") as "sm" | "md" | "lg";

  const brandCls = brandSize === "sm" ? "text-sm" : brandSize === "lg" ? "text-lg" : "text-base";
  const linksCls = linksSize === "sm" ? "text-xs" : linksSize === "lg" ? "text-base" : "text-sm";

  const logoPx = logoSize === "sm" ? 24 : logoSize === "lg" ? 36 : 28;

  const detailsRef = React.useRef<HTMLDetailsElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [inDashboardPreview, setInDashboardPreview] = React.useState(false);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setInDashboardPreview(!!el.closest('[data-preview="true"]'));
  }, []);

  // close menu on outside click
  React.useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;

    const closeIfOutside = (e: PointerEvent) => {
      if (!el.hasAttribute("open")) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (el.contains(target)) return;
      el.removeAttribute("open");
    };

    document.addEventListener("pointerdown", closeIfOutside, true);
    return () => document.removeEventListener("pointerdown", closeIfOutside, true);
  }, []);

  // In dashboard preview do not raise z-index (so header does not overlap Site settings)
  const rootZ = inDashboardPreview ? "z-0" : "z-10";

  const rootVars: React.CSSProperties = {
    ...(hdrText ? ({ ["--hdr-text" as any]: hdrText } as any) : {}),
    ...(hdrLink ? ({ ["--hdr-link" as any]: hdrLink } as any) : {}),
    ...(hdrBg ? ({ ["--hdr-bg" as any]: hdrBg } as any) : {}),
    ...(ctaBg ? ({ ["--hdr-cta-bg" as any]: ctaBg } as any) : {}),
    ...(ctaText ? ({ ["--hdr-cta-text" as any]: ctaText } as any) : {}),
    ...(ctaBorder ? ({ ["--hdr-cta-border" as any]: ctaBorder } as any) : {}),
  };

  const hdrRadius = normalizeRadiusValue((style as any).radius);

  const Brand = () => {
    const inner = (
      <div className="flex items-center gap-2 min-w-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={brandText || "Logo"}
            style={{ width: logoPx, height: logoPx }}
            className="rounded-full object-cover border border-white/10"
          />
        ) : null}
        <div
          className={[
            "font-semibold truncate",
            brandCls,
            hdrText ? "text-[var(--hdr-text)]" : "text-white/90",
          ].join(" ")}
        >
          {brandText || " "}
        </div>
      </div>
    );

    if (brandUrl) {
      return (
        <a href={brandUrl} className="hover:opacity-90 transition-opacity">
          {inner}
        </a>
      );
    }
    return inner;
  };

  const Links = ({
    justify,
    layout = "row",
    closeOnClick = false,
  }: {
    justify: "start" | "center" | "end";
    layout?: "row" | "col";
    closeOnClick?: boolean;
  }) => (
    <div
      className={[
        layout === "col" ? "flex flex-col gap-2" : "flex flex-wrap gap-x-4 gap-y-2",
        layout === "col"
          ? "items-stretch"
          : justify === "center"
            ? "justify-center"
            : justify === "end"
              ? "justify-end"
              : "justify-start",
        linksCls,
      ].join(" ")}
    >
      {items.map((it, idx) => (
        <a
          key={idx}
          href={normalizeUrl(it.url)}
          onClick={(e) => {
            const href = normalizeUrl(it.url);

            if (closeOnClick) {
              const d = (e.currentTarget as any)?.closest?.("details");
              if (d && typeof d.removeAttribute === "function") d.removeAttribute("open");
            }

            if (href && href.startsWith("#")) {
              e.preventDefault();
              const id = href.slice(1);

              if (typeof window !== "undefined") {
                window.history.pushState(null, "", href);
              }

              if (typeof window !== "undefined") {
                window.requestAnimationFrame(() => {
                  window.requestAnimationFrame(() => {
                    const el = document.getElementById(id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                });
              }
            }
          }}
          className={layout === "col" ? "px-3 py-2 hover:bg-white/10 transition" : "transition-colors"}
          style={{ color: hdrLink ? "var(--hdr-link)" : undefined }}
        >
          {safeTrim(it.label)}
        </a>
      ))}
    </div>
  );

  const Cta = () =>
    hasCta && ctaLabel && ctaUrl ? (
      <a
        href={ctaUrl}
        className={[
          "inline-flex items-center justify-center rounded-full px-4 py-2 font-semibold transition border",
          linksCls,
          "bg-white/10 hover:bg-white/15 border-white/10 text-white/90",
        ].join(" ")}
        style={{
          background: ctaBg ? "var(--hdr-cta-bg)" : undefined,
          color: ctaText ? "var(--hdr-cta-text)" : undefined,
          borderColor: ctaBorder ? "var(--hdr-cta-border)" : undefined,
        }}
      >
        {ctaLabel}
      </a>
    ) : null;

  const wrapBgCls = hdrBg ? "bg-[var(--hdr-bg)]" : "bg-white/5";

  if (variant === "centered") {
    return (
      <div ref={rootRef} className={`w-full relative ${rootZ}`} style={rootVars}>
        <div
          className={`${wrapBgCls} border border-white/10 px-4 py-4`}
          style={{ borderRadius: hdrRadius }}
        >
          <div className="flex items-center justify-center">
            <Brand />
          </div>

          {items.length ? (
            <div className="mt-3">
              <Links justify="center" />
            </div>
          ) : null}

          {hasCta ? (
            <div className="mt-3 flex justify-center">
              <Cta />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // default
  return (
    <div ref={rootRef} className={`w-full relative ${rootZ}`} style={rootVars}>
      <div
        className={`relative ${wrapBgCls} border border-white/10 px-4 py-3`}
        style={{ borderRadius: hdrRadius }}
      >
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <Brand />
          </div>

          {items.length ? (
            <div className="hidden sm:block flex-1">
              <Links justify="center" />
            </div>
          ) : null}

          {hasCta ? (
            <div className="hidden sm:flex justify-end">
              <Cta />
            </div>
          ) : null}

          {items.length || hasCta ? (
            <div className="sm:hidden">
              <details ref={detailsRef} className="group" suppressHydrationWarning>
                <summary
                  className={[
                    "flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full",
                    "border border-white/10 bg-white/5 text-white/85",
                    "hover:bg-white/10 hover:text-white",
                    "transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                  ].join(" ")}
                  aria-label="Toggle menu"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-90 group-open:hidden"
                  >
                    <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="hidden opacity-90 group-open:block"
                  >
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </summary>

                {/* In dashboard preview do not raise z, otherwise overlaps Site settings */}
                <div className="hidden group-open:block absolute left-4 right-4 top-[3.25rem] z-0">
                  <div
                    className={[
                      "border border-white/10 overflow-hidden",
                      hdrBg ? "bg-[var(--hdr-bg)]" : "bg-black",
                      "max-h-[70vh] overflow-auto pr-1",
                      "px-3 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
                      "origin-top scale-95 opacity-0 translate-y-1",
                      "group-open:scale-100 group-open:opacity-100 group-open:translate-y-0",
                      "transition duration-150",
                    ].join(" ")}
                    style={{ borderRadius: hdrRadius }}
                  >
                    <div className="flex flex-col gap-2">
                      {items.length ? (
                        <div
                          className="bg-white/5 px-3 py-3"
                          style={{ borderRadius: hdrRadius }}
                        >
                          <Links justify="start" layout="col" closeOnClick />
                        </div>
                      ) : null}

                      {hasCta ? (
                        <div className={items.length ? "pt-1" : ""}>
                          <div className={items.length ? "h-px w-full bg-white/10 mb-3" : ""} />
                          <div
                            className="flex justify-start px-1"
                            onClick={(e) => {
                              const d = (e.currentTarget as any)?.closest?.("details");
                              if (d && typeof d.removeAttribute === "function") d.removeAttribute("open");
                            }}
                          >
                            <Cta />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </details>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

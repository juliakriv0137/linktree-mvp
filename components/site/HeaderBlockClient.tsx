"use client";

import * as React from "react";

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function normalizeUrl(raw: any) {
  const v = safeTrim(raw);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v) && !v.startsWith("#")) return `https://${v}`;
  return v;
}

export type HeaderLinkItem = {
  label: string;
  url: string;
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
}) {
  const variant = String(props.variant ?? "default");

  const brandText = safeTrim(props.brandText || "My Site");
  const brandUrl = normalizeUrl(props.brandUrl || "");
  const logoUrl = safeTrim(props.logoUrl || "");

  const items = Array.isArray(props.items) ? props.items : [];
  const hasCta = Boolean(props.hasCta);
  const ctaLabel = safeTrim(props.ctaLabel || "");
  const ctaUrl = normalizeUrl(props.ctaUrl || "");

  const detailsRef = React.useRef<HTMLDetailsElement | null>(null);

  React.useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;

    const closeIfOutside = (e: PointerEvent) => {
      // only when open
      if (!el.hasAttribute("open")) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (el.contains(target)) return;
      el.removeAttribute("open");
    };

    // capture=true to beat inner handlers
    document.addEventListener("pointerdown", closeIfOutside, true);
    return () => document.removeEventListener("pointerdown", closeIfOutside, true);
  }, []);

  const Brand = () => {
    const inner = (
      <div className="flex items-center gap-2 min-w-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={brandText || "Logo"}
            className="h-7 w-7 rounded-full object-cover border border-white/10"
          />
        ) : null}
        <div className="font-semibold text-white/90 truncate">{brandText || " "}</div>
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
        layout === "col"
          ? "flex flex-col gap-2 text-sm text-white/80"
          : "flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/70",
        layout === "col"
          ? "items-stretch"
          : justify === "center"
            ? "justify-center"
            : justify === "end"
              ? "justify-end"
              : "justify-start",
      ].join(" ")}
    >
      {items.map((it, idx) => (
        <a
          key={idx}
          href={normalizeUrl(it.url)}
          onClick={
            closeOnClick
              ? (e) => {
                  const d = (e.currentTarget as any)?.closest?.("details");
                  if (d && typeof d.removeAttribute === "function") d.removeAttribute("open");
                }
              : undefined
          }
          className={
            layout === "col"
              ? "rounded-xl px-3 py-2 hover:bg-white/10 hover:text-white transition"
              : "hover:text-white/90 transition-colors"
          }
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
        className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-white/10 hover:bg-white/15 transition border border-white/10"
      >
        {ctaLabel}
      </a>
    ) : null;

  if (variant === "centered") {
    return (
      <div className="w-full">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
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
    <div className="w-full">
      <div className="relative rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
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

          {(items.length || hasCta) ? (
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
                  {/* burger */}
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

                  {/* close (X) */}
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

                <div className="absolute left-4 right-4 top-[3.25rem] z-[100]">
                  <div
                    className={[
                      "rounded-2xl border border-white/10 bg-black",
                      "max-h-[70vh] overflow-auto pr-1",
                      "px-3 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
                      "origin-top scale-95 opacity-0 translate-y-1",
                      "group-open:scale-100 group-open:opacity-100 group-open:translate-y-0",
                      "transition duration-150",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-2">
                      {items.length ? (
                        <div className="rounded-xl bg-white/5 px-3 py-3">
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

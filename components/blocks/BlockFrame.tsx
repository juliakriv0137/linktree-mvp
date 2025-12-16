import * as React from "react";
import type { SiteBlockRow } from "@/components/blocks/BlocksRenderer";

type Props = {
  block: SiteBlockRow;
  anchorId?: string;
  children: React.ReactNode;
};

type BlockStyleV1 = {
  padding?: "none" | "sm" | "md" | "lg" | string;
  width?: "compact" | "wide" | "full" | string;
  bg?: "none" | "card" | string;

  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | string;
  border?: "none" | "subtle" | string;
  align?: "left" | "center" | string;

  // responsive overrides
  mobile?: Partial<Omit<BlockStyleV1, "mobile">> | null;
};

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

function prefixEach(prefix: string, cls: string) {
  const parts = String(cls || "").trim().split(/\s+/).filter(Boolean);
  return parts.map((c) => `${prefix}${c}`).join(" ");
}

function paddingClass(padding: string) {
  switch (padding) {
    case "none":
      return "p-0";
    case "sm":
      return "px-3 py-3";
    case "lg":
      return "px-6 py-6";
    case "md":
    default:
      return "px-4 py-4";
  }
}

function widthClass(width: string) {
  switch (width) {
    case "full":
      return "w-full";
    case "wide":
      return "mx-auto w-full max-w-4xl";
    case "compact":
    default:
      return "mx-auto w-full max-w-md";
  }
}

function alignClass(align: string) {
  switch (align) {
    case "center":
      return "text-center";
    case "left":
    default:
      return "text-left";
  }
}

function radiusClass(radius: string) {
  switch (radius) {
    case "none":
      return "rounded-none";
    case "sm":
      return "rounded-sm";
    case "md":
      return "rounded-md";
    case "lg":
      return "rounded-lg";
    case "xl":
      return "rounded-xl";
    case "2xl":
    default:
      return "rounded-2xl";
  }
}

function borderClass(border: string) {
  switch (border) {
    case "none":
      return "border border-transparent";
    case "subtle":
    default:
      return "border border-white/10";
  }
}

function bgClass(bg: string) {
  switch (bg) {
    case "card":
      return "bg-white/5 backdrop-blur";
    case "none":
    default:
      return "";
  }
}

/**
 * BlockFrame (builder core) with responsive overrides.
 *
 * block.style tokens (desktop by default):
 * - padding, width, bg, radius, border, align
 *
 * Mobile overrides:
 * style.mobile = { padding?, width?, bg?, radius?, border?, align? }
 *
 * Behavior:
 * - base (mobile-first) uses style.mobile.* if present, else falls back to desktop value
 * - md+: uses desktop values via md: prefixed classes
 */
export function BlockFrame({ block, anchorId, children }: Props) {
  const style = asObj(block.style) as BlockStyleV1;
  const mobile = asObj(style.mobile) as Partial<BlockStyleV1>;

  // desktop defaults
  const d = {
    padding: String(style.padding ?? "none"),
    width: String(style.width ?? "full"),
    bg: String(style.bg ?? "none"),
    radius: String(style.radius ?? "2xl"),
    border: String(style.border ?? "subtle"),
    align: String(style.align ?? "left"),
  };

  // mobile-first effective values (override if provided)
  const m = {
    padding: String(mobile.padding ?? d.padding),
    width: String(mobile.width ?? d.width),
    bg: String(mobile.bg ?? d.bg),
    radius: String(mobile.radius ?? d.radius),
    border: String(mobile.border ?? d.border),
    align: String(mobile.align ?? d.align),
  };

  const outerCls = "scroll-mt-24 min-w-0";

  // base (mobile)
  const base = [
    widthClass(m.width),
    paddingClass(m.padding),
    bgClass(m.bg),
    borderClass(m.border),
    radiusClass(m.radius),
    alignClass(m.align),
  ]
    .filter(Boolean)
    .join(" ");

  // md+ (desktop) — always apply desktop classes to ensure consistent desktop rendering
  const desktop = [
    prefixEach("md:", widthClass(d.width)),
    prefixEach("md:", paddingClass(d.padding)),
    prefixEach("md:", bgClass(d.bg)),
    prefixEach("md:", borderClass(d.border)),
    prefixEach("md:", radiusClass(d.radius)),
    prefixEach("md:", alignClass(d.align)),
  ]
    .filter(Boolean)
    .join(" ");

  const innerCls = [base, desktop].filter(Boolean).join(" ");

  return (
    <section
      id={anchorId || undefined}
      data-block-id={block.id}
      data-block-type={block.type}
      data-anchor-id={anchorId || undefined}
      className={block.type === "header" ? outerCls + " relative z-[50]" : outerCls}
    >
      <div className={innerCls}>{children}</div>
    </section>
  );
}

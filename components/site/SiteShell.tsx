"use client";

import React from "react";
import {
  LAYOUT_DEFAULTS,
  SPACING_PX,
  RADIUS_PX,
  type LayoutVariant,
} from "@/lib/design/tokens";

import { BackgroundStyle, ThemeOverrides, cssVarsFromSiteTheme } from "@/lib/themes";

function clampNumber(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Layout preset keys stored on Site (DB).
 * IMPORTANT:
 * - DB field is a string, so we can extend presets without migrations.
 * - We keep legacy aliases: compact/wide/full.
 */
export type LayoutPreset =
  | "compact"
  | "wide"
  | "xwide"
  | "xxwide"
  | "full"
  // future-friendly presets (safe: stored as string)
  | "centered"
  | "editorial"
  | "landing"
  | "narrow"
  | (string & {});

type Props = {
  children: React.ReactNode;
  themeKey?: string | null;
  backgroundStyle?: BackgroundStyle;

  // Stored on Site (DB) and MUST affect LinkButton visuals.
  buttonStyle?: "solid" | "outline" | "soft";

  // Size/shape tokens
  fontScale?: "sm" | "md" | "lg" | number | null;
  buttonRadius?: "md" | "xl" | "2xl" | "full" | number | null;

  // Card wrapper style
  cardStyle?: "plain" | "card";

  // Optional per-site color overrides (DB)
  themeOverrides?: ThemeOverrides | null;

  /**
   * Stored preset key from DB. Examples: "compact" | "wide" | "full".
   * Can be extended to "xwide", "xxwide", etc.
   */
  layoutWidth?: LayoutPreset | null;
};

/**
 * Single source of truth:
 * DB preset key -> LayoutVariant used by design/tokens
 *
 * We keep this mapping centralized so PublicPage/Dashboard don't invent their own container logic.
 */
function mapPresetToVariant(preset: LayoutPreset | null | undefined): LayoutVariant {
  const key = String(preset ?? "compact").toLowerCase();

  // legacy / current presets
  if (key === "compact") return "compact";
  if (key === "wide") return "wide";
  if (key === "full") return "full";

  // new width presets (we keep tokens simple and override maxWidth below)
  if (key === "xwide") return "wide";
  if (key === "xxwide") return "wide";

  // other presets (opt-in). If tokens don't have them yet — map to closest existing.
  if (key === "centered") return "compact";
  if (key === "narrow") return "compact";
  if (key === "editorial") return "wide";
  if (key === "landing") return "full";

  // fallback for unknown keys
  return "compact";
}

function maxWidthOverridePx(preset: LayoutPreset | null | undefined): number | null {
  const key = String(preset ?? "").toLowerCase();
  // two new options between wide and full
  if (key === "xwide") return 1280; // between wide and full
  if (key === "xxwide") return 1440; // closer to full, still clamped
  return null;
}

function parseRgbTriplet(input: any): [number, number, number] | null {
  const s = String(input ?? "").trim();
  // expected: "R G B"
  const m = s.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
  if (!m) return null;
  const r = Math.max(0, Math.min(255, Number(m[1])));
  const g = Math.max(0, Math.min(255, Number(m[2])));
  const b = Math.max(0, Math.min(255, Number(m[3])));
  return [r, g, b];
}

function autoTextOnRgb(rgbTriplet: any): string {
  const rgb = parseRgbTriplet(rgbTriplet) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((v) => v / 255);

  // relative luminance (simple sRGB)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // if background is light -> use black text, else white
  return lum > 0.62 ? "0 0 0" : "255 255 255";
}

export function SiteShell({
  children,
  themeKey,
  backgroundStyle = "solid",
  buttonStyle = "solid",
  fontScale = "md",
  buttonRadius = "2xl",
  cardStyle = "card",
  themeOverrides,
  layoutWidth = "compact",
  ...rest
}: Props & React.HTMLAttributes<HTMLDivElement>) {
  const safeRest = Object.fromEntries(
    Object.entries(rest || {}).filter(([k]) => k.startsWith("data-") || k.startsWith("aria-")),
  ) as React.HTMLAttributes<HTMLDivElement>;

  const layoutVariant = mapPresetToVariant(layoutWidth);
  const layout = LAYOUT_DEFAULTS[layoutVariant];

  const overrideMax = maxWidthOverridePx(layoutWidth);

  const layoutContainerStyle: React.CSSProperties = {
    /**
     * "full" should feel like a real full-screen website:
     * - no maxWidth clamp at outer container level
     * Other presets can use token-based maxWidth.
     */
    maxWidth:
      layoutVariant === "full"
        ? undefined
        : overrideMax != null
          ? `${overrideMax}px`
          : layout.maxWidthPx === null
            ? undefined
            : `${layout.maxWidthPx}px`,
    marginLeft: "auto",
    marginRight: "auto",
    width: "100%",
  };

  const blockGapPx = `${SPACING_PX[layout.blockGap]}px`;
  const vars = cssVarsFromSiteTheme(themeKey, themeOverrides);
  const primaryTriplet = (vars as any)["--primary"];
  const solidTextTriplet = autoTextOnRgb(primaryTriplet);

  const defaultBtnTextTriplet = autoTextOnRgb((vars as any)["--primary"]);

  // font scale: supports "sm|md|lg" OR numeric
  const scaleFromKey = fontScale === "sm" ? 0.9 : fontScale === "lg" ? 1.15 : 1;
  const scale = typeof fontScale === "number" ? clampNumber(fontScale, 0.8, 1.3) : scaleFromKey;
  const rootFontSizePx = `${16 * scale}px`;

  // Typography role vars (button)
  const buttonTextSizeRem = `${0.95 * scale}rem`;
  const buttonTextWeight = 600;

  // button radius: supports presets OR numeric(px)
  const radiusPx =
    typeof buttonRadius === "number"
      ? clampNumber(buttonRadius, 0, 48)
      : buttonRadius === "md"
        ? 12
        : buttonRadius === "xl"
          ? 16
          : buttonRadius === "full"
            ? 9999
            : 24;

  const buttonRadiusCss = `${radiusPx}px`;

  // Radius system (token-based). Map to our radius tokens for now.
  const radiusToken =
    typeof buttonRadius === "number"
      ? "md"
      : buttonRadius === "md"
        ? "md"
        : buttonRadius === "xl"
          ? "lg"
          : buttonRadius === "full"
            ? "xl"
            : "xl";

  const radiusCss = `${RADIUS_PX[radiusToken]}px`;

  // Card vars
  const cardVars =
    cardStyle === "plain"
      ? {
          "--card-bg": "transparent",
          "--card-border": "none",
          "--card-shadow": "none",
          "--card-padding": "0px",
        }
      : {
          "--card-bg": "rgb(var(--card) / 0.55)",
          "--card-border": "1px solid rgb(var(--border) / 0.6)",
          "--card-shadow": "0 10px 30px rgba(0,0,0,0.35)",
          "--card-padding": "24px",
        };

  // Button style vars (used by components/site/LinkButton)
    // Button style vars (used by components/site/LinkButton)
    const buttonVars =
    buttonStyle === "outline"
      ? {
          "--btn-bg": "transparent",
          "--btn-text": "rgb(var(--primary))",
          "--btn-border": "rgb(var(--primary) / 0.9)",
          "--btn-hover-bg": "rgb(var(--primary) / 0.08)",
          "--btn-hover-text": "rgb(var(--primary))",
          "--btn-hover-border": "rgb(var(--primary) / 1)",
        }
      : buttonStyle === "soft"
        ? {
            "--btn-bg": "rgb(var(--primary) / 0.12)",
            "--btn-text": "rgb(var(--primary))",
            "--btn-border": "rgb(var(--primary) / 0.10)",
            "--btn-hover-bg": "rgb(var(--primary) / 0.18)",
            "--btn-hover-text": "rgb(var(--primary))",
            "--btn-hover-border": "rgb(var(--primary) / 0.14)",
          }
          : {
            // solid (default) - do NOT rely on --button-text (it may be non-triplet)
            "--btn-bg": "rgb(var(--primary))",
            "--btn-text": `rgb(${solidTextTriplet})`,
            "--btn-border": "transparent",
            "--btn-hover-bg": "rgb(var(--primary) / 0.92)",
            "--btn-hover-text": `rgb(${solidTextTriplet})`,
            "--btn-hover-border": "transparent",
          };


  const bgClass =
    backgroundStyle === "gradient"
      ? "bg-[radial-gradient(1200px_circle_at_20%_10%,rgb(var(--primary)/0.25),transparent_45%),radial-gradient(900px_circle_at_80%_0%,rgb(var(--primary-2)/0.20),transparent_45%),rgb(var(--bg))]"
      : backgroundStyle === "dots"
        ? "bg-[radial-gradient(rgb(var(--text)/0.10)_1px,transparent_1px)] [background-size:16px_16px] bg-[rgb(var(--bg))]"
        : "bg-[rgb(var(--bg))]";

  return (
    <div
      {...safeRest}
      style={
        {
          ...(vars as React.CSSProperties),
          ...(cardVars as React.CSSProperties),
          ...(buttonVars as React.CSSProperties),
          fontSize: rootFontSizePx,
          ["--text-button-size" as any]: buttonTextSizeRem,
          ["--text-button-weight" as any]: buttonTextWeight,
          ["--btn-padding" as any]: `${Math.round(12 * scale)}px ${Math.round(16 * scale)}px`,
          ["--btn-min-h" as any]: `${Math.round(44 * scale)}px`,
          ["--button-radius" as any]: buttonRadiusCss,
          ["--block-gap" as any]: blockGapPx,
          ["--radius" as any]: radiusCss,
        } as React.CSSProperties
      }
      
      className={`min-h-screen ${bgClass}`}
    >
      {/* data-layout-width stays as the raw preset key from DB (useful for blocks). */}
      <div className="group w-full" data-layout-width={layoutWidth ?? "compact"}>
        <div style={layoutContainerStyle}>{children}</div>
      </div>
    </div>
  );
}

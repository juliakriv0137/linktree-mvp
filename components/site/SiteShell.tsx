"use client";

import React from "react";
import { LAYOUT_DEFAULTS, SPACING_PX, RADIUS_PX, type LayoutVariant } from "@/lib/design/tokens";

import {
  BackgroundStyle,
  ThemeOverrides,
  cssVarsFromSiteTheme,
} from "@/lib/themes";

function clampNumber(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export type LayoutWidth = "compact" | "wide" | "full";

type Props = {
  children: React.ReactNode;
  themeKey?: string | null;
  backgroundStyle?: BackgroundStyle;
  buttonStyle?: "solid" | "outline" | "soft";
  fontScale?: "sm" | "md" | "lg" | number | null;
  buttonRadius?: "md" | "xl" | "2xl" | "full" | number | null;
  cardStyle?: "plain" | "card";
  themeOverrides?: ThemeOverrides | null;
  layoutWidth?: LayoutWidth;
};

export function SiteShell({
  children,
  themeKey,
  backgroundStyle = "solid",
  fontScale = "md",
  buttonRadius = "2xl",
  cardStyle = "card",
  themeOverrides,
  layoutWidth = "compact",
}: Props) {
  
  // Layout variant (site-level). One per site.
  // For now we map existing layoutWidth presets to layout variants.
  const layoutVariant: LayoutVariant =
    layoutWidth === "wide" ? "wide" : layoutWidth === "full" ? "full" : "compact";
  const layout = LAYOUT_DEFAULTS[layoutVariant ?? "centered"];
  const layoutContainerStyle: React.CSSProperties = {
    // "full" should feel like a real full-screen website (no max-width clamp on the outer shell).
    maxWidth:
      layoutWidth === "full"
        ? undefined
        : layout.maxWidthPx === null
          ? undefined
          : `${layout.maxWidthPx}px`,
    marginLeft: "auto",
    marginRight: "auto",
    width: "100%",
  };

  const blockGapPx = `${SPACING_PX[layout.blockGap]}px`;
const vars = cssVarsFromSiteTheme(themeKey, themeOverrides);

  // font scale: supports "sm|md|lg" OR numeric
  const scaleFromKey =
    fontScale === "sm" ? 0.9 : fontScale === "lg" ? 1.15 : 1;

  const scale =
    typeof fontScale === "number"
      ? clampNumber(fontScale, 0.8, 1.3)
      : scaleFromKey;

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

  // Radius system (token-based). We map current buttonRadius presets to our radius tokens for now.
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

  const bgClass =
    backgroundStyle === "gradient"
      ? "bg-[radial-gradient(1200px_circle_at_20%_10%,rgb(var(--primary)/0.25),transparent_45%),radial-gradient(900px_circle_at_80%_0%,rgb(var(--primary-2)/0.20),transparent_45%),rgb(var(--bg))]"
      : backgroundStyle === "dots"
      ? "bg-[radial-gradient(rgb(var(--text)/0.10)_1px,transparent_1px)] [background-size:16px_16px] bg-[rgb(var(--bg))]"
      : "bg-[rgb(var(--bg))]";

  return (
    <div
      style={
        {
          ...(vars as React.CSSProperties),
          ...(cardVars as React.CSSProperties),
          fontSize: rootFontSizePx,
          ["--text-button-size" as any]: buttonTextSizeRem,
          ["--text-button-weight" as any]: buttonTextWeight,
          ["--button-radius" as any]: buttonRadiusCss,
          ["--block-gap" as any]: blockGapPx,
          ["--radius" as any]: radiusCss,
        } as React.CSSProperties
      }
      className={`min-h-screen ${bgClass}`}
    >
      {/* group + data-layout-width нужны, чтобы LinksBlock мог нормализовать ширину в wide/full */}
      <div className="group w-full" data-layout-width={layoutWidth}>
        <div style={layoutContainerStyle}>{children}</div>
      </div>
    </div>
  );
}

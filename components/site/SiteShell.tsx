import React, { ReactNode } from "react";
import { cssVarsFromTheme } from "@/lib/themes";

type BackgroundStyle = "solid" | "gradient" | "dots";

type Props = {
  themeKey?: string | null;
  backgroundStyle?: BackgroundStyle;

  // ✅ step 1: font scale
  fontScale?: "sm" | "md" | "lg" | number | null;


  // ✅ temporarily accept, will be used in next steps
  buttonStyle?: any;

  children: ReactNode;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SiteShell({
  themeKey,
  backgroundStyle = "solid",
  fontScale,
  buttonStyle, // intentionally unused for now
  children,
}: Props) {
  const vars = cssVarsFromTheme(themeKey);

  const bgClass =
    backgroundStyle === "gradient"
      ? "bg-[radial-gradient(1200px_circle_at_20%_10%,rgb(var(--primary)/0.25),transparent_40%),radial-gradient(900px_circle_at_80%_30%,rgb(var(--primary-2)/0.2),transparent_45%),rgb(var(--bg))]"
      : backgroundStyle === "dots"
      ? "bg-[radial-gradient(rgb(var(--text)/0.08)_1px,transparent_1px)] [background-size:16px_16px] bg-[rgb(var(--bg))]"
      : "bg-[rgb(var(--bg))]";

      const scaleFromKey =
      fontScale === "sm" ? 0.9 :
      fontScale === "lg" ? 1.15 :
      1;
    
    const scale =
      typeof fontScale === "number"
        ? clampNumber(fontScale, 0.8, 1.3)
        : scaleFromKey;
    
        const rootFontSizePx = `${16 * scale}px`;
        
        return (
          <div
            style={{
              ...(vars as React.CSSProperties),
              fontSize: rootFontSizePx,
              ["--font-scale" as any]: scale,
            }}
            className={`min-h-screen ${bgClass}`}
          >
            <div
              className="mx-auto w-full max-w-md px-4 py-10"
              style={{ transform: "scale(var(--font-scale))", transformOrigin: "top center" }}
            >
              {children}
            </div>
          </div>
        );
        
        }
        

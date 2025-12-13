import React from "react";

type SiteShellProps = {
  children: React.ReactNode;
  themeKey?: string | null;
  backgroundStyle?: string | null;
  buttonStyle?: string | null;
  fontScale?: number | null;
  cardStyle?: string | null;
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SiteShell({
  children,
  themeKey,
  backgroundStyle,
  buttonStyle,
  fontScale,
  cardStyle,
}: SiteShellProps) {
  const scale = clampNumber(typeof fontScale === "number" ? fontScale : 1, 0.8, 1.3);
  const rootFontSizePx = `${16 * scale}px`;

  return (
    <div
      data-theme={themeKey ?? "default"}
      data-bg={backgroundStyle ?? "default"}
      data-buttons={buttonStyle ?? "default"}
      data-card={cardStyle ?? "default"}
      style={{ fontSize: rootFontSizePx }}
      className="min-h-screen w-full"
    >
      {children}
    </div>
  );
}

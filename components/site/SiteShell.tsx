import { ReactNode } from "react";
import { cssVarsFromTheme } from "@/lib/themes";

type BackgroundStyle = "solid" | "gradient" | "dots";

type Props = {
  themeKey?: string | null;
  backgroundStyle?: BackgroundStyle;
  children: ReactNode;
};

export function SiteShell({
  themeKey,
  backgroundStyle = "solid",
  children,
}: Props) {
  const vars = cssVarsFromTheme(themeKey);

  const bgClass =
    backgroundStyle === "gradient"
      ? "bg-[radial-gradient(1200px_circle_at_20%_10%,rgb(var(--primary)/0.25),transparent_40%),radial-gradient(900px_circle_at_80%_30%,rgb(var(--primary-2)/0.2),transparent_45%),rgb(var(--bg))]"
      : backgroundStyle === "dots"
      ? "bg-[radial-gradient(rgb(var(--text)/0.08)_1px,transparent_1px)] [background-size:16px_16px] bg-[rgb(var(--bg))]"
      : "bg-[rgb(var(--bg))]";

  return (
    <div
      style={vars as React.CSSProperties}
      className={`min-h-screen ${bgClass}`}
    >
      <div className="mx-auto w-full max-w-md px-4 py-10">
        {children}
      </div>
    </div>
  );
}

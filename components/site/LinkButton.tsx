"use client";

import * as React from "react";
import Link from "next/link";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type ButtonStyle = "solid" | "outline" | "soft";

type Props = {
  href: string;

  /** Backward/registry compatible: registry passes label="" and self-closing. */
  label?: string | null;

  /** Optional: can also render via children */
  children?: React.ReactNode;

  /** Registry passes this too (Hero primary/secondary, Links block style). */
  buttonStyle?: ButtonStyle;

  className?: string;
  title?: string;
  target?: string;
  rel?: string;
};

function normalizeButtonStyle(v: any): ButtonStyle {
  return v === "outline" || v === "soft" || v === "solid" ? v : "solid";
}

function localVarsForStyle(style: ButtonStyle): Record<string, string> {
  // These vars override locally on this button, even if SiteShell doesn't set them.
  if (style === "outline") {
    return {
      ["--btn-bg" as any]: "transparent",
      ["--btn-text" as any]: "rgb(var(--primary))",
      ["--btn-border" as any]: "rgb(var(--primary) / 0.9)",
      ["--btn-hover-bg" as any]: "rgb(var(--primary) / 0.08)",
      ["--btn-hover-text" as any]: "rgb(var(--primary))",
      ["--btn-hover-border" as any]: "rgb(var(--primary) / 1)",
    };
  }

  if (style === "soft") {
    return {
      ["--btn-bg" as any]: "rgb(var(--primary) / 0.12)",
      ["--btn-text" as any]: "rgb(var(--primary))",
      ["--btn-border" as any]: "rgb(var(--primary) / 0.10)",
      ["--btn-hover-bg" as any]: "rgb(var(--primary) / 0.18)",
      ["--btn-hover-text" as any]: "rgb(var(--primary))",
      ["--btn-hover-border" as any]: "rgb(var(--primary) / 0.14)",
    };
  }

  // solid default
  return {
    ["--btn-bg" as any]: "rgb(var(--primary))",
    // If theme provides --button-text triplet, use it; otherwise default to white.
    ["--btn-text" as any]: "rgb(var(--button-text, 255 255 255))",
    ["--btn-border" as any]: "transparent",
    ["--btn-hover-bg" as any]: "rgb(var(--primary) / 0.92)",
    ["--btn-hover-text" as any]: "rgb(var(--button-text, 255 255 255))",
    ["--btn-hover-border" as any]: "transparent",
  };
}

function hasNonEmptyStringChild(children: React.ReactNode): boolean {
  if (typeof children === "string") return children.trim().length > 0;
  return children != null;
}

export function LinkButton({
  href,
  label,
  children,
  buttonStyle,
  className,
  title,
  target,
  rel,
}: Props) {
  const styleKey = normalizeButtonStyle(buttonStyle);

  // Text resolution: prefer children if present; else fallback to label.
  const content =
    hasNonEmptyStringChild(children) ? children : String(label ?? "").trim();

  const base =
    "inline-flex w-full items-center justify-center gap-2 select-none " +
    "border transition-colors outline-none " +
    "focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-[rgb(var(--primary)/0.55)] " +
    "ring-offset-[rgb(var(--bg))] lt-linkbtn";

  const cls = cx(base, className);

  const hoverCss = `
    .lt-linkbtn:hover {
      background: var(--btn-hover-bg, var(--btn-bg, rgb(var(--primary)))) !important;
      color: var(--btn-hover-text, var(--btn-text, rgb(255 255 255))) !important;
      border-color: var(--btn-hover-border, var(--btn-border, transparent)) !important;
    }
    .lt-linkbtn:active {
      transform: translateY(0.5px);
    }
  `;

  const style: React.CSSProperties = {
    // safe defaults even if SiteShell vars are missing
    background: "var(--btn-bg, rgb(var(--primary)))",
    color: "var(--btn-text, rgb(255 255 255))",
    borderColor: "var(--btn-border, transparent)",
    borderRadius: "var(--button-radius, 24px)",
    borderWidth: "1px",
    borderStyle: "solid",
    padding: "var(--btn-padding, 12px 16px)",
    minHeight: "var(--btn-min-h, 44px)",
    fontSize: "var(--text-button-size, 1rem)" as any,
    fontWeight: "var(--text-button-weight, 600)" as any,
    textDecoration: "none",
    lineHeight: 1.1,
    width: "100%",
    // per-button style overrides (so registry buttonStyle works)
    
  };

  // Internal routes -> Next Link
  if (href.startsWith("/")) {
    return (
      <>
        <style>{hoverCss}</style>
        <Link href={href} className={cls} style={style} title={title}>
          {content}
        </Link>
      </>
    );
  }

  // Hash anchors -> plain <a>
  if (href.startsWith("#")) {
    return (
      <>
        <style>{hoverCss}</style>
        <a href={href} className={cls} style={style} title={title}>
          {content}
        </a>
      </>
    );
  }

  // External
  const external =
    /^https?:\/\//i.test(href) ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("sms:");

  return (
    <>
      <style>{hoverCss}</style>
      <a
        href={href}
        className={cls}
        style={style}
        title={title}
        target={target ?? (external ? "_blank" : undefined)}
        rel={rel ?? (external ? "noreferrer noopener" : undefined)}
      >
        {content}
      </a>
    </>
  );
}

"use client";

import * as React from "react";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "ghost" | "danger";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)] " +
    "disabled:opacity-40 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? [
          // primary — мятная, основной CTA
          "border border-[rgb(var(--db-accent)/0.6)]",
          "bg-[rgb(var(--db-accent))]",
          "text-[rgb(var(--db-text))]",
          "hover:bg-[rgb(var(--db-accent)/0.9)]",
        ].join(" ")
      : variant === "danger"
        ? [
            // danger — красная, белый текст допустим
            "border border-red-600/60",
            "bg-red-600",
            "text-white",
            "hover:bg-red-500",
          ].join(" ")
        : [
            // ghost — нейтральная, без белого текста
            "border border-[rgb(var(--db-border))]",
            "bg-[rgb(var(--db-panel))]",
            "text-[rgb(var(--db-text))]",
            "hover:bg-[rgb(var(--db-soft))]",
            "hover:border-[rgb(var(--db-accent)/0.55)]",
          ].join(" ");

  return (
    <button {...props} className={clsx(base, styles, className)}>
      {children}
    </button>
  );
}

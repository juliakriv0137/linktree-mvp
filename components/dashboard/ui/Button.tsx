"use client";

import * as React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "ghost" | "danger" | "pill" | "pillDanger";
type ButtonSize = "sm" | "md";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type ?? "button"}
      className={clsx(
        // base
        "inline-flex items-center justify-center font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",

        // shape & size (only for pill variants)
        (variant === "pill" || variant === "pillDanger") &&
          (size === "sm"
            ? "h-8 px-3 text-xs rounded-full"
            : "h-9 px-4 text-sm rounded-full"),

        // default (non-pill)
        variant !== "pill" &&
          variant !== "pillDanger" &&
          "px-4 py-2 rounded-full",

        // variants
        variant === "primary" &&
          "border border-[rgb(var(--db-border))] bg-[rgb(var(--db-accent-weak))] text-[rgb(var(--db-text))] hover:opacity-90",

        variant === "ghost" &&
          "border border-[rgb(var(--db-border))] bg-transparent text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-soft))]",

        variant === "danger" &&
          "border border-transparent bg-[#c63b32] text-white hover:opacity-90",

        variant === "pill" &&
          "border border-[rgb(var(--db-border))] bg-white text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-soft))]",

        variant === "pillDanger" &&
          "border border-transparent bg-red-600 text-white hover:bg-red-700",

        className,
      )}
    />
  );
}

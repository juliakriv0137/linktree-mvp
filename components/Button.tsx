"use client";

import React from "react";
import { cx } from "@/lib/ui";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary:
      "bg-black text-white hover:bg-zinc-800 focus:ring-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus:ring-white",
    secondary:
      "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:ring-zinc-700",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
  };

  return <button className={cx(base, variants[variant], className)} {...props} />;
}

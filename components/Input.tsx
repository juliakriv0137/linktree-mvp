"use client";

import React from "react";
import { cx } from "@/lib/ui";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium">{label}</div> : null}
      <input
        className={cx(
          "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/10",
          error ? "border-red-500 focus:border-red-600 focus:ring-red-500/10" : "",
          className
        )}
        {...props}
      />
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
      {!error && hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </label>
  );
}

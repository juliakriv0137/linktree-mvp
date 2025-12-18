"use client";

import * as React from "react";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function IconButton({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={clsx(
        "inline-flex h-9 w-9 items-center justify-center rounded-2xl border text-sm transition text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-ring)/0.35)]",
        disabled
          ? "cursor-not-allowed opacity-40 border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))]"
          : "border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] hover:bg-[rgb(var(--db-soft))] hover:border-[rgb(var(--db-accent)/0.55)]",
      )}
    >
      {children}
    </button>
  );
}

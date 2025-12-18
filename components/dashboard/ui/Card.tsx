"use client";

import * as React from "react";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        // Light dashboard panel (like NINEMAGS). Uses --db-* vars from /dashboard.
        "rounded-[var(--db-radius)] border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] shadow-[0_18px_40px_rgba(15,23,42,0.10)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

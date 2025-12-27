"use client";

import * as React from "react";
import { useDbDetails } from "./DbDetails";

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: "summary" | "button";
};

export function DbSummaryButton({ as = "summary", className, ...props }: Props) {
  const { open, setOpen } = useDbDetails();

  // ✅ визуально как остальные pill-кнопки (Refresh / Sign out / Open public page)
  const common = {
    className: [
      "inline-flex items-center justify-center rounded-full",
      "border border-[rgb(var(--db-border))]",
      "bg-[rgb(var(--db-soft))] hover:bg-[rgb(var(--db-panel))] transition",
      "px-4 py-2 font-semibold text-[rgb(var(--db-text))]",
"text-[length:var(--text-button-size)] font-[var(--text-button-weight)]",

      "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
      "select-none",
      className ?? "",
    ].join(" "),
    ...props,
  } as any;

  if (as === "button") {
    return (
      <button
        type="button"
        {...common}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
          props.onClick?.(e as any);
        }}
      />
    );
  }

  return (
    <summary
      {...common}
      // ✅ убираем стандартный треугольник summary
      style={{ listStyle: "none", ...(common.style ?? {}) }}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!open);
        props.onClick?.(e as any);
      }}
    />
  );
}

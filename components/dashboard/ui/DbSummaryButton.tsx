"use client";

import * as React from "react";
import { useDbDetails } from "./DbDetails";

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: "summary" | "button";
};

export function DbSummaryButton({ as = "summary", className, ...props }: Props) {
  const { open, setOpen } = useDbDetails();

  // Делаем кликабельным и предсказуемым
  const common = {
    className: [
      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
      "border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] text-[rgb(var(--db-text))]",
      "hover:bg-[rgb(var(--db-soft))]",
      "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
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
      // убираем стандартный треугольник summary
      style={{ listStyle: "none", ...(common.style ?? {}) }}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault(); // иначе details сам переключает open, а нам нужно управлять самим
        e.stopPropagation();
        setOpen(!open);
        props.onClick?.(e as any);
      }}
    />
  );
}

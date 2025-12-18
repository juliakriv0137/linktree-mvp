import * as React from "react";
import clsx from "clsx";

export type DbPillProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md";
};

export function DbPill({ className, size = "md", ...props }: DbPillProps) {
  return (
    <div
      className={clsx(
        "rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))]",
        size === "sm" ? "px-2 py-1" : "px-3 py-2",
        className,
      )}
      {...props}
    />
  );
}

import * as React from "react";
import clsx from "clsx";

export type DbPopoverPanelProps = React.HTMLAttributes<HTMLDivElement>;

export function DbPopoverPanel({ className, ...props }: DbPopoverPanelProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-bg))] p-3 shadow-2xl",
        className,
      )}
      {...props}
    />
  );
}

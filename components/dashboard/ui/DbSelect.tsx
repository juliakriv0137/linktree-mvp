import * as React from "react";
import clsx from "clsx";

export type DbSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function DbSelect({ className, ...props }: DbSelectProps) {
  return (
    <select
      className={clsx(
        "h-9 rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-bg))] px-3 text-xs text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent) / 0.30)]",
        className,
      )}
      {...props}
    />
  );
}

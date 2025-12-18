import * as React from "react";
import clsx from "clsx";

export type DbInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function DbInput({ className, ...props }: DbInputProps) {
  return (
    <input
      className={clsx(
        "h-9 w-full rounded-xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-bg))] px-3 text-sm text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent) / 0.30)]",
        className,
      )}
      {...props}
    />
  );
}

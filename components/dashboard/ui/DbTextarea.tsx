import * as React from "react";
import clsx from "clsx";

export type DbTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function DbTextarea({ className, ...props }: DbTextareaProps) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-bg))] px-3 py-2 text-sm text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
        className,
      )}
      {...props}
    />
  );
}

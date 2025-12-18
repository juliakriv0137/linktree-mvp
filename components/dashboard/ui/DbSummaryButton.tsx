import * as React from "react";
import clsx from "clsx";

export type DbSummaryButtonProps = React.HTMLAttributes<HTMLElement> & {
  as?: "summary" | "button";
};

export function DbSummaryButton({ as = "summary", className, ...props }: DbSummaryButtonProps) {
  const Comp: any = as;
  return (
    <Comp
      className={clsx(
        "cursor-pointer select-none rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-bg))] px-3 py-2 text-xs text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-soft))]",
        className,
      )}
      {...props}
    />
  );
}

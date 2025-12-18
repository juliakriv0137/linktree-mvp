import * as React from "react";
import clsx from "clsx";

export function DbFieldRow({
  label,
  children,
  hint,
  error,
  right,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-end gap-3", className)}>
      <div className="flex-1 min-w-0">
        <label className="block">
          <div className="text-sm text-[rgb(var(--db-text))] mb-2">{label}</div>
          {children}
          {error ? <div className="text-xs text-red-600 mt-2">{error}</div> : null}
          {!error && hint ? <div className="text-xs text-[rgb(var(--db-muted))] mt-2">{hint}</div> : null}
        </label>
      </div>

      {right ? <div className="w-[64px]">{right}</div> : null}
    </div>
  );
}

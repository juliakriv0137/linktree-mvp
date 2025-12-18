"use client";

import * as React from "react";
import { normalizeHexOrNull } from "@/lib/dashboard/utils";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function ColorField({
  label,
  value,
  onChange,
  placeholder = "#rrggbb",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const normalized = normalizeHexOrNull(value) ?? "#000000";
  const isValid = value ? normalizeHexOrNull(value) !== null : true;

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block">
          <div className="text-sm text-[rgb(var(--db-text))] mb-2">{label}</div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={clsx(
              "w-full rounded-2xl border px-4 py-3 text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))]",
              "bg-[rgb(var(--db-panel))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
              isValid ? "border-[rgb(var(--db-border))]" : "border-red-500/50",
            )}
          />
          {!isValid && (
            <div className="text-xs text-red-600 mt-2">Invalid hex. Use #fff or #ffffff.</div>
          )}
        </label>
      </div>

      <div className="w-[64px]">
        <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Pick</div>
        <input
          type="color"
          value={normalized}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            "h-[44px] w-full cursor-pointer rounded-xl border p-1",
            "border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))]",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
          )}
          aria-label={`${label} color picker`}
        />
      </div>
    </div>
  );
}

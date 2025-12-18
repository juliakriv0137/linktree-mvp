"use client";

import { normalizeHexOrNull } from "@/lib/dashboard/utils";
import { DbInput } from "./DbInput";
import { DbFieldRow } from "./DbFieldRow";

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
    <DbFieldRow
      label={label}
      error={
        !isValid ? (
          <>
            Invalid hex. Use <span className="font-mono">#fff</span> or{" "}
            <span className="font-mono">#ffffff</span>.
          </>
        ) : undefined
      }
      right={
        <>
          <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Pick</div>
          <input
            type="color"
            value={normalized}
            onChange={(e) => onChange((e.target as HTMLInputElement).value)}
            className="h-[44px] w-full cursor-pointer rounded-xl border p-1 border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
            aria-label={`${label} color picker`}
          />
        </>
      }
    >
      <DbInput
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        className={isValid ? "" : "border-red-500/50"}
      />
    </DbFieldRow>
  );
}

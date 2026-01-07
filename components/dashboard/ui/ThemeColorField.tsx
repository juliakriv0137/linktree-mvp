"use client";

import * as React from "react";

type Props = {
  label: string;
  value: string; // "" = theme default
  onChange: (next: string) => void;

  placeholder?: string; // default "#rrggbb"
  disabled?: boolean;
};

function isFullHex(v: string) {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

function normalizeHexOrEmpty(input: string): string {
  const s = input.trim();
  if (s === "") return "";
  const v = s.startsWith("#") ? s : `#${s}`;
  return v;
}

export function ThemeColorField({
  label,
  value,
  onChange,
  placeholder = "#rrggbb",
  disabled = false,
}: Props) {
  const v = value ?? "";
  const normalized = normalizeHexOrEmpty(v);

  const valid = normalized === "" ? true : isFullHex(normalized);
  const swatch = isFullHex(normalized) ? normalized : "#ffffff";

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[color:var(--text)]">{label}</div>
        <div className="text-xs text-[color:var(--muted)]">Pick</div>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-3">
        <input
          value={v}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            const next = normalizeHexOrEmpty(e.target.value);
            onChange(next);
          }}
          className={[
            "w-full min-w-0 rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none",
            "border-[color:var(--border)] text-[color:var(--text)] placeholder:text-[color:var(--muted)]",
            disabled ? "opacity-60" : "",
            !valid ? "border-red-500/70" : "",
          ].join(" ")}
        />

        {/* Важно: НЕ кликаем input программно.
            Реальный <input type="color"> лежит поверх свотча (прозрачный),
            поэтому системный picker открывается рядом с контролом, а не в углу. */}
        <div className="relative h-12 w-16 rounded-2xl border border-[color:var(--border)] bg-transparent">
          <div
            className="absolute inset-2 rounded-xl border border-[color:var(--border)]"
            style={{ backgroundColor: swatch }}
          />
          <input
            type="color"
            value={swatch}
            disabled={disabled}
            onChange={(e) => {
              const next = String((e.target as HTMLInputElement).value || "").toLowerCase();
              onChange(next);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} color picker`}
          />
        </div>
      </div>
    </div>
  );
}

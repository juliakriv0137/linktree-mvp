import * as React from "react";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safeTrim(v: string) {
  return (v ?? "").trim();
}

function normalizeHexOrNull(v: string): string | null {
  const raw = safeTrim(v);
  if (!raw) return null;

  const m = raw.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;

  let hex = m[1].toLowerCase();
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${hex}`;
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
          <div className="text-sm text-white/80 mb-2">{label}</div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-2xl border bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20",
              isValid ? "border-white/10" : "border-red-500/50",
            )}
          />
          {!isValid && (
            <div className="text-xs text-red-300 mt-2">Invalid hex. Use #fff or #ffffff.</div>
          )}
        </label>
      </div>

      <div className="w-[64px]">
        <div className="text-xs text-white/50 mb-2">Pick</div>
        <input
          type="color"
          value={normalized}
          onChange={(e) => onChange(e.target.value)}
          className="h-[44px] w-full cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
          aria-label={`${label} color picker`}
        />
      </div>
    </div>
  );
}

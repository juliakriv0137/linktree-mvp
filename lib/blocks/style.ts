export type StyleDevice = "desktop" | "mobile";

/**
 * Canonical tokens (new format we want to converge to).
 * We still support legacy shapes via normalization.
 */
export type BlockStyleTokens = {
  padding?: "none" | "sm" | "md" | "lg" | string;

  // canonical widths
  width?: "content" | "wide" | "full" | string;

  // canonical background
  background?: "none" | "card" | "highlight" | string;

  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | string;
  border?: "none" | "subtle" | "strong" | string;
  align?: "left" | "center" | "right" | string;
};

export type BlockStyle = BlockStyleTokens & {
  /**
   * Backward/forward compatible responsive overrides:
   * - legacy: style.mobile = { ...tokens }
   * - future: can also support style.desktop if needed later
   */
  mobile?: Partial<BlockStyleTokens> | null;
  desktop?: Partial<BlockStyleTokens> | null;

  // legacy aliases that might exist in DB
  bg?: any;
};

/** ---------- helpers ---------- */

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

function prefixEach(prefix: string, cls: string) {
  const parts = String(cls || "").trim().split(/\s+/).filter(Boolean);
  return parts.map((c) => `${prefix}${c}`).join(" ");
}

/** ---------- token -> class mapping ---------- */

function paddingClass(padding: string) {
  switch (padding) {
    case "none":
      return "p-0";
    case "sm":
      return "px-3 py-3";
    case "lg":
      return "px-6 py-6";
    case "md":
    default:
      return "px-4 py-4";
  }
}

function widthClass(width: string) {
  // support both canonical + legacy ("compact")
  switch (width) {
    case "full":
      return "w-full";
    case "wide":
      return "mx-auto w-full max-w-4xl";
    case "content":
    case "compact":
    default:
      return "mx-auto w-full max-w-md";
  }
}

function alignClass(align: string) {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    case "left":
    default:
      return "text-left";
  }
}

function radiusClass(radius: string) {
  switch (radius) {
    case "none":
      return "";
    case "sm":
      return "";
    case "md":
      return "";
    case "lg":
      return "";
    case "xl":
      return "";
    case "2xl":
    default:
      return "";
  }
}

function borderClass(border: string) {
  switch (border) {
    case "none":
      return "border border-transparent";
    case "strong":
      return "border border-white/20";
    case "subtle":
    default:
      return "border border-white/10";
  }
}

function backgroundClass(bg: string) {
  // support canonical `background` and legacy `bg`
  switch (bg) {
    case "card":
      return "bg-white/5 backdrop-blur";
    case "highlight":
      return "bg-white/10 backdrop-blur";
    case "none":
    default:
      return "";
  }
}

/** ---------- normalization ---------- */

export function normalizeBlockStyle(input: any): Required<Pick<BlockStyle, keyof BlockStyleTokens>> & {
  mobile: Partial<BlockStyleTokens>;
  desktop: Partial<BlockStyleTokens>;
} {
  const raw = asObj(input) as BlockStyle;

  // legacy fallback: bg -> background
  const backgroundRaw =
    raw.background ?? raw.bg ?? "none";

  // legacy fallback: width compact -> content
  const widthRaw =
    raw.width ?? "full";

  const desktop = asObj(raw.desktop) as Partial<BlockStyleTokens>;
  const mobile = asObj(raw.mobile) as Partial<BlockStyleTokens>;

  const base = {
    padding: String(raw.padding ?? "none"),
    width: String(widthRaw ?? "full"),
    background: String(backgroundRaw ?? "none"),
    radius: String(raw.radius ?? "2xl"),
    border: String(raw.border ?? "subtle"),
    align: String(raw.align ?? "left"),
  };

  const normalizePartial = (p: any): Partial<BlockStyleTokens> => {
    const o = asObj(p);
    const out: Partial<BlockStyleTokens> = {};
    if ("padding" in o) out.padding = String(o.padding);
    if ("width" in o) out.width = String(o.width);
    if ("background" in o || "bg" in o) out.background = String(o.background ?? o.bg);
    if ("radius" in o) out.radius = String(o.radius);
    if ("border" in o) out.border = String(o.border);
    if ("align" in o) out.align = String(o.align);
    return out;
  };

  return {
    ...base,
    mobile: normalizePartial(mobile),
    desktop: normalizePartial(desktop),
  };
}

/**
 * Effective tokens for given device:
 * base + device override
 */
export function effectiveTokens(inputStyle: any, device: StyleDevice): BlockStyleTokens {
  const s = normalizeBlockStyle(inputStyle);
  const ovr = device === "mobile" ? s.mobile : s.desktop;
  return { ...s, ...ovr };
}

/**
 * Canonical wrapper className for BlockFrame.
 * - mobile-first base applies effective mobile tokens
 * - md: prefixed classes force desktop tokens on md+
 */
export function blockFrameClassName(inputStyle: any): string {
  const s = normalizeBlockStyle(inputStyle);

  // desktop values (base + desktop override)
  const d = { ...s, ...s.desktop };

  // mobile-first effective values (base + mobile override)
  const m = { ...s, ...s.mobile };

  const base = [
    widthClass(String(m.width ?? "full")),
    paddingClass(String(m.padding ?? "none")),
    backgroundClass(String(m.background ?? "none")),
    borderClass(String(m.border ?? "subtle")),
    radiusClass(String(m.radius ?? "2xl")),
    alignClass(String(m.align ?? "left")),
  ]
    .filter(Boolean)
    .join(" ");

  const desktop = [
    prefixEach("md:", widthClass(String(d.width ?? "full"))),
    prefixEach("md:", paddingClass(String(d.padding ?? "none"))),
    prefixEach("md:", backgroundClass(String(d.background ?? "none"))),
    prefixEach("md:", borderClass(String(d.border ?? "subtle"))),
    prefixEach("md:", radiusClass(String(d.radius ?? "2xl"))),
    prefixEach("md:", alignClass(String(d.align ?? "left"))),
  ]
    .filter(Boolean)
    .join(" ");

  return [base, desktop].filter(Boolean).join(" ");
}

/** ---------- presets (deltas) ---------- */

export type StylePresetKey = "card" | "minimal" | "wide_section" | "centered" | "hero_highlight";

export const STYLE_PRESETS: Record<StylePresetKey, Partial<BlockStyle>> = {
  card: {
    background: "card",
    border: "subtle",
    radius: "2xl",
    padding: "md",
    width: "wide",
  },
  minimal: {
    background: "none",
    border: "none",
    radius: "none",
    padding: "none",
    width: "full",
  },
  wide_section: {
    width: "full",
    padding: "md",
  },
  centered: {
    align: "center",
  },
  hero_highlight: {
    background: "highlight",
    border: "strong",
    radius: "2xl",
    padding: "lg",
    width: "full",
    align: "center",
  },
};

export function mergeStyle(prev: any, next: Partial<BlockStyle>): BlockStyle {
  const p = asObj(prev) as BlockStyle;
  const n = asObj(next) as BlockStyle;

  // preserve existing overrides unless explicitly overwritten
  return {
    ...p,
    ...n,
    mobile: { ...(asObj(p.mobile) as any), ...(asObj(n.mobile) as any) },
    desktop: { ...(asObj(p.desktop) as any), ...(asObj(n.desktop) as any) },
  };
}

export function applyStylePreset(prev: any, key: StylePresetKey): BlockStyle {
  return mergeStyle(prev, STYLE_PRESETS[key]);
}

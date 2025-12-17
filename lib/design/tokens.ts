export const COLOR_ROLES = [
  "bg",
  "surface",
  "text",
  "muted",
  "border",
  "primary",
  "onPrimary",
  "accent",
  "divider",
] as const;

export type ColorRole = (typeof COLOR_ROLES)[number];

/**
 * We store roles, not hex.
 * Values are CSS variable names that SiteShell will apply later.
 */
export const COLOR_ROLE_TO_CSS_VAR: Record<ColorRole, string> = {
  bg: "--bg",
  surface: "--surface",
  text: "--text",
  muted: "--muted",
  border: "--border",
  primary: "--primary",
  onPrimary: "--on-primary",
  accent: "--accent",
  divider: "--divider",
};

export const LAYOUT_VARIANTS = [
  "compact",
  "centered",
  "wide",
  "full",
  "readable",
] as const;

export type LayoutVariant = (typeof LAYOUT_VARIANTS)[number];

/**
 * Layout = site "mode". No per-block layout (for now).
 * These are defaults; we can tune numbers later without changing API.
 */
export type LayoutDefaults = {
  /** max content width in px, null = full width */
  maxWidthPx: number | null;
  /** horizontal page padding */
  pagePx: SpacingToken;
  /** vertical page padding */
  pagePy: SpacingToken;
  /** gap between blocks */
  blockGap: SpacingToken;
};

export const SPACING_TOKENS = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
export type SpacingToken = (typeof SPACING_TOKENS)[number];

/**
 * Scale is token-based. Numbers are in pixels for now.
 * Later we can convert to rem without changing consumers.
 */
export const SPACING_PX: Record<SpacingToken, number> = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
};

export const RADIUS_TOKENS = ["none", "sm", "md", "lg", "xl"] as const;
export type RadiusToken = (typeof RADIUS_TOKENS)[number];

export const RADIUS_PX: Record<RadiusToken, number> = {
  none: 0,
  sm: 10,
  md: 15,
  lg: 30,
  xl: 50,
};

export const TYPOGRAPHY_ROLES = [
  "display",
  "h1",
  "h2",
  "body",
  "bodyMuted",
  "caption",
  "button",
  "label",
] as const;

export type TypographyRole = (typeof TYPOGRAPHY_ROLES)[number];

export const BUTTON_ROLES = ["primary", "secondary", "ghost"] as const;
export type ButtonRole = (typeof BUTTON_ROLES)[number];

export type ButtonState = "default" | "hover" | "active" | "disabled";

export const LAYOUT_DEFAULTS: Record<LayoutVariant, LayoutDefaults> = {
  compact: {
    maxWidthPx: 460,
    pagePx: "md",
    pagePy: "lg",
    blockGap: "sm",
  },
  centered: {
    maxWidthPx: 720,
    pagePx: "lg",
    pagePy: "xl",
    blockGap: "md",
  },
  wide: {
    maxWidthPx: 1100,
    pagePx: "xl",
    pagePy: "xl",
    blockGap: "lg",
  },
  full: {
    maxWidthPx: null,
    pagePx: "lg",
    pagePy: "xl",
    blockGap: "lg",
  },
  readable: {
    maxWidthPx: 680,
    pagePx: "lg",
    pagePy: "xl",
    blockGap: "md",
  },
};

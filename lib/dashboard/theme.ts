// lib/dashboard/theme.ts
// Dashboard UI theme (NOT the public site theme).
// Keep this file self-contained to avoid coupling with site themes.

export type DashboardThemeVars = {
  "--db-bg": string;          // rgb triplet "R G B"
  "--db-panel": string;       // rgb triplet
  "--db-border": string;      // rgb triplet
  "--db-text": string;        // rgb triplet
  "--db-muted": string;       // rgb triplet
  "--db-accent": string;      // rgb triplet
  "--db-accent-weak": string; // rgb triplet
  "--db-ring": string;        // rgb triplet
  "--db-radius": string;      // css length, e.g. "16px"
};

/**
 * These vars style the Dashboard itself (panels, borders, etc.).
 * They are intentionally separate from the public site theme vars.
 */
export const DASHBOARD_THEME_VARS: DashboardThemeVars = {
  // Light SaaS look
  "--db-bg": "247 250 252",        // #F7FAFC-ish
  "--db-panel": "255 255 255",     // #FFFFFF
  "--db-border": "230 238 245",    // soft border
  "--db-text": "31 41 55",         // slate-800
  "--db-muted": "107 114 128",     // slate-500
  "--db-accent": "79 209 197",     // mint/teal
  "--db-accent-weak": "227 250 247",
  "--db-ring": "79 209 197",
  "--db-radius": "16px",
};

/**
 * Optional helper if you apply vars to a wrapper via inline styles:
 * <div style={dashboardVarsToStyle()}>
 */
export function dashboardVarsToStyle(vars: DashboardThemeVars = DASHBOARD_THEME_VARS) {
  // Convert to CSS custom properties:
  // { "--db-bg": "247 250 252", ... }
  return vars as unknown as React.CSSProperties;
}

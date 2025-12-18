"use client";

import * as React from "react";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export const inspectorLabel =
  "text-xs font-medium text-[rgb(var(--db-text))] mb-2";

export const inspectorHint =
  "text-xs text-[rgb(var(--db-muted))]";

export const inspectorInput =
  "w-full rounded-2xl border border-[rgb(var(--db-border))] " +
  "bg-[rgb(var(--db-panel))] px-3 py-2 text-sm " +
  "text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] " +
  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]";

export const inspectorSelect = inspectorInput;

export const inspectorTextarea =
  inspectorInput + " min-h-[96px] resize-vertical";

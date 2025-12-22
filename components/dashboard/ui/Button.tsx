"use client";

import * as React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "ghost" | "danger";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className, type, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type ?? "button"}
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-4 py-2 font-semibold transition",
        "border border-[rgb(var(--db-border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
        variant === "primary" && "bg-[rgb(var(--db-accent-weak))] text-[rgb(var(--db-text))] hover:opacity-90",
        variant === "ghost" && "bg-transparent text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-soft))]",
        variant === "danger" && "bg-[#c63b32] text-white hover:opacity-90 border-transparent",
        props.disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    />
  );
}

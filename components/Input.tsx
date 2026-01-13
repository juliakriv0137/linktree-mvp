"use client";

import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
};

export function Input({
  label,
  hint,
  error,
  containerClassName = "",
  inputClassName = "",
  className, // оставим для совместимости, но применим к input
  id,
  ...props
}: Props) {
  const autoId = React.useId();
  const inputId = id ?? autoId;

  return (
    <div className={containerClassName}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-semibold text-zinc-900"
        >
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={[
          "w-full px-4 py-3 text-base outline-none transition",
          "border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400",
          "focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          // радиус как в проекте
          "",
          className ?? "",
          inputClassName,
        ].join(" ")}
        style={{ borderRadius: "18px" }}
        aria-invalid={!!error}
        {...props}
      />

      {error ? (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      ) : hint ? (
        <div className="mt-2 text-xs text-zinc-500">{hint}</div>
      ) : null}
    </div>
  );
}

"use client";

import React from "react";

type ToastState = { message: string; type: "success" | "error" } | null;

export function useToast() {
  const [toast, setToast] = React.useState<ToastState>(null);

  function show(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2600);
  }

  const node = toast ? (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div
        className={[
          "rounded-2xl px-4 py-3 text-sm shadow-lg backdrop-blur",
          toast.type === "success"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white",
        ].join(" ")}
      >
        {toast.message}
      </div>
    </div>
  ) : null;

  return { show, Toast: node };
}

"use client";

import * as React from "react";

type DbDetailsCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  close: () => void;
};

const Ctx = React.createContext<DbDetailsCtx | null>(null);

export function useDbDetails() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useDbDetails must be used within <DbDetails>");
  return v;
}

export function DbDetails({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDetailsElement | null>(null);
  const [open, setOpenState] = React.useState(false);

  const setOpen = React.useCallback((v: boolean) => {
    setOpenState(v);
    const el = ref.current;
    if (!el) return;
    if (v) el.setAttribute("open", "");
    else el.removeAttribute("open");
  }, []);

  const close = React.useCallback(() => setOpen(false), [setOpen]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onToggle = () => {
      setOpenState(el.open);
    };

    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const root = ref.current;
      if (!root) return;
      const target = e.target as Node | null;
      if (!target) return;

      // клик внутри details — не закрываем
      if (root.contains(target)) return;
      close();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true } as any);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <Ctx.Provider value={{ open, setOpen, close }}>
      <details
        ref={ref}
        className={[
          // ВАЖНО: relative — чтобы popover absolute позиционировался “от кнопки”
          "relative",
          // marker у summary уберём в DbSummaryButton
          "select-none",
          className ?? "",
        ].join(" ")}
      >
        {children}
      </details>
    </Ctx.Provider>
  );
}

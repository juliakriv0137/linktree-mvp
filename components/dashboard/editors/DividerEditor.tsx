"use client";

import * as React from "react";

type DividerEditorProps = {
  block: any;
  onSave: (next: any) => Promise<void> | void;
};

export function DividerEditor({ block, onSave }: DividerEditorProps) {
  // пока нет настроек — но мы держим контракт onSave,
  // чтобы всё было единообразно с другими editor-ами
  const content = (block?.content ?? {}) as Record<string, unknown>;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/50 mb-3">Divider block</div>

      <div className="flex justify-center py-4">
        <div className="h-px w-24 bg-white/20" />
      </div>

      <div className="text-xs text-white/40 mt-2">No settings yet.</div>

      <div className="mt-4">
        <button
          type="button"
          className="rounded-full px-4 py-2 text-xs font-semibold border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition"
          onClick={() => {
            // noop save — чтобы компонент был "живым" и типы сходились
            void onSave({ content });
          }}
        >
          Save (noop)
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Block } from "@/lib/blocks";

type Props = {
  blocks: Block[];
};

export default function BlocksRenderer({ blocks }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => {
        const wrap = (node: React.ReactNode) => (
          <div
            key={block.id}
            style={{
              background: "var(--card-bg)",
              border: "var(--card-border)",
              boxShadow: "var(--card-shadow)",
              padding: "var(--card-padding)",
              borderRadius: "var(--button-radius)",
            }}
          >
            {node}
          </div>
        );

        switch (block.type) {
          case "heading":
            return wrap(
              <h1
                className={`font-bold ${
                  block.size === "xl"
                    ? "text-4xl"
                    : block.size === "lg"
                    ? "text-3xl"
                    : "text-2xl"
                } text-${block.align ?? "center"}`}
              >
                {block.text}
              </h1>
            );

          case "text":
            return wrap(
              <p
                className={`text-gray-300 text-${block.align ?? "center"}`}
              >
                {block.text}
              </p>
            );

          case "button":
            return wrap(
              <a
                href={block.url}
                target="_blank"
                className={`px-4 py-3 text-center font-medium transition ${
                  block.style === "secondary"
                    ? "bg-neutral-700 hover:bg-neutral-600"
                    : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {block.label}
              </a>
            );

          case "image":
            return wrap(
              <img
                src={block.url}
                alt={block.alt ?? ""}
                style={{ borderRadius: block.radius ?? 12 }}
                className="w-full object-cover"
              />
            );

          case "divider":
            return <hr key={block.id} className="border-neutral-700" />;

          case "spacer":
            return (
              <div
                key={block.id}
                style={{ height: block.height ?? 16 }}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

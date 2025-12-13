"use client";

import { Block } from "@/lib/blocks";

type Props = {
  blocks: Block[];
};

export default function BlocksRenderer({ blocks }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading":
            return (
              <h1
                key={block.id}
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
            return (
              <p
                key={block.id}
                className={`text-gray-300 text-${block.align ?? "center"}`}
              >
                {block.text}
              </p>
            );

          case "button":
            return (
              <a
                key={block.id}
                href={block.url}
                target="_blank"
                className={`rounded-xl px-4 py-3 text-center font-medium transition ${
                  block.style === "secondary"
                    ? "bg-neutral-700 hover:bg-neutral-600"
                    : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {block.label}
              </a>
            );

          case "image":
            return (
              <img
                key={block.id}
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

"use client";

import * as React from "react";
import { useEffect, useState } from "react";

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm text-[rgb(var(--db-text))] mb-2">{label}</div>
      <input
        className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <div className="text-sm text-[rgb(var(--db-text))] mb-2">{label}</div>
      <textarea
        className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function Button({
  children,
  disabled,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)] disabled:opacity-50 disabled:cursor-not-allowed";

  const cls =
    variant === "secondary"
      ? `${base} border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] text-[rgb(var(--db-text))] hover:bg-white/10`
      : `${base} bg-white text-black hover:opacity-90`;

  return (
    <button type="button" className={cls} disabled={disabled} onClick={onClick as any}>
      {children}
    </button>
  );
}



export function HeroEditor({
  block,
  onSave,
}: {
  block: any;
  onSave: (next: { content: any; variant: string }) => Promise<void>;
}) {
  const initial = (block.content ?? {}) as any;



  const [title, setTitle] = useState(initial.title ?? "");
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "");
  const [titleSize, setTitleSize] = useState(initial.title_size ?? "lg");

  const [subtitleSize, setSubtitleSize] = useState(
    initial.subtitle_size ?? "md",
  );
  
  const [align, setAlign] = useState(
    initial.align ?? "center",
  );
  
  const [verticalAlign, setVerticalAlign] = useState(
    (initial as any)?.vertical_align ?? "center",
  );
  
  const [variant, setVariant] = useState(
    (block as any).variant ?? "default",
  );
  
  const [imageSide, setImageSide] = useState<"left" | "right">(
    (initial as any)?.image_side ?? "right",
  );
  
  const [imageSize, setImageSize] = useState(
    (initial as any)?.image_size ?? "md",
  );
  
  const [bgHeight, setBgHeight] = useState<"sm" | "md" | "lg" | "xl">(
    (initial as any)?.bg_height ?? "md",
  );
  
  const [bgOverlay, setBgOverlay] = useState<"soft" | "medium" | "strong">(
    (initial as any)?.bg_overlay ?? "medium",
  );
  
  const [bgRadius, setBgRadius] = useState<
    "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  >(
    (initial as any)?.bg_radius ?? "2xl",
  );
  
  const [imageRatio, setImageRatio] = useState(
    (initial as any)?.image_ratio ?? "square",
  );
  




  const [primaryBtnTitle, setPrimaryBtnTitle] = useState((initial as any)?.primary_button_title ?? "");
  const [primaryBtnUrl, setPrimaryBtnUrl] = useState((initial as any)?.primary_button_url ?? "");
  const [secondaryBtnTitle, setSecondaryBtnTitle] = useState((initial as any)?.secondary_button_title ?? "");
  const [secondaryBtnUrl, setSecondaryBtnUrl] = useState((initial as any)?.secondary_button_url ?? "");

  const [avatar, setAvatar] = useState<string>((initial.avatar as any) ?? "");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = (block.content ?? {}) as any;

    setTitle(c.title ?? "");
    setSubtitle(c.subtitle ?? "");
    setTitleSize((c.title_size as any) ?? "lg");
    setSubtitleSize((c.subtitle_size as any) ?? "md");
setAlign((c.align as any) ?? "center");
setVerticalAlign(((c as any)?.vertical_align ?? "center") as any);
setVariant(((block as any).variant ?? "default") as string);

    setImageSide(((c as any)?.image_side ?? "right") as any);
    setImageSize(((c as any)?.image_size ?? "md") as any);
    setBgOverlay(((c as any)?.bg_overlay ?? "medium") as any);
    setImageRatio(((c as any)?.image_ratio ?? "square") as any);
    setBgHeight(((c as any)?.bg_height ?? "md") as any);
    setBgRadius(((c as any)?.bg_radius ?? "2xl") as any);




    setPrimaryBtnTitle(((c as any)?.primary_button_title ?? "") as string);
    setPrimaryBtnUrl(((c as any)?.primary_button_url ?? "") as string);
    setSecondaryBtnTitle(((c as any)?.secondary_button_title ?? "") as string);
    setSecondaryBtnUrl(((c as any)?.secondary_button_url ?? "") as string);

    setAvatar((c.avatar as any) ?? "");
  }, [block.id, block.content]);

  const titleClass =
    titleSize === "sm" ? "text-xl" : titleSize === "md" ? "text-2xl" : "text-3xl";
  const subtitleClass =
    subtitleSize === "sm" ? "text-sm" : subtitleSize === "lg" ? "text-lg" : "text-base";
  const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

  return (
    <div className="space-y-4">
      <div className="text-xs text-[rgb(var(--db-muted))]">Hero block</div>

      <Input label="Title" value={title} onChange={setTitle} placeholder="Your name / brand" />

      <Textarea
        label="Subtitle"
        value={subtitle}
        onChange={setSubtitle}
        placeholder="Short bio / tagline"
        rows={3}
      />

      <label className="block">
        <div className="text-sm text-[rgb(var(--db-text))] mb-2">Variant</div>
        <select
          className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
        >
          <option value="default">Default</option>
<option value="split">Split (text + image)</option>
<option value="background">Background image</option>

        </select>
      </label>
      {variant === "background" ? (
        <label className="block">
          <div className="text-sm text-[rgb(var(--db-text))] mb-2">Section height</div>
          <select
            className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
            value={bgHeight}
            onChange={(e) => setBgHeight(e.target.value as any)}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">X-Large</option>
          </select>
          <div className="text-xs text-[rgb(var(--db-muted))] mt-2">
            Controls vertical padding / minimum height for background hero.
          </div>
        </label>
      ) : null}

{variant === "background" ? (
  <label className="block">
    <div className="text-sm text-[rgb(var(--db-text))] mb-2">Corner radius</div>
    <select
      className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
      value={bgRadius}
      onChange={(e) => setBgRadius(e.target.value as any)}
    >
      <option value="none">None</option>
      <option value="sm">Small</option>
      <option value="md">Medium</option>
      <option value="lg">Large</option>
      <option value="xl">X-Large</option>
      <option value="2xl">2X-Large</option>
      <option value="full">Full</option>
    </select>
    <div className="text-xs text-[rgb(var(--db-muted))] mt-2">
      Controls rounding of background hero block.
    </div>
  </label>
) : null}


      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-4 space-y-3">
        <div className="text-sm text-[rgb(var(--db-text))]">Buttons (optional)</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-3">
            <div className="text-xs text-[rgb(var(--db-muted))]">Primary button</div>
            <Input
              label="Title"
              value={primaryBtnTitle}
              onChange={setPrimaryBtnTitle}
              placeholder="Request a demo"
            />
            <Input
              label="URL"
              value={primaryBtnUrl}
              onChange={setPrimaryBtnUrl}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-3">
            <div className="text-xs text-[rgb(var(--db-muted))]">Secondary button</div>
            <Input
              label="Title"
              value={secondaryBtnTitle}
              onChange={setSecondaryBtnTitle}
              placeholder="Learn more"
            />
            <Input
              label="URL"
              value={secondaryBtnUrl}
              onChange={setSecondaryBtnUrl}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="text-xs text-[rgb(var(--db-muted))]">
          To show a button, fill both Title and URL. You can use only Primary, or both.
        </div>
      </div>

      {variant === "split" || variant === "background" ? (
  <Input
    label={variant === "background" ? "Background image URL" : "Avatar / Image URL"}
    value={avatar}
    onChange={setAvatar}
    placeholder="https://example.com/image.png"
  />
) : null}
{variant === "background" ? (
  <label className="block">
    <div className="text-sm text-[rgb(var(--db-text))] mb-2">Overlay</div>
    <select
      className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
      value={bgOverlay}
      onChange={(e) => setBgOverlay(e.target.value as any)}
    >
      <option value="soft">Soft</option>
      <option value="medium">Medium</option>
      <option value="strong">Strong</option>
    </select>
  </label>
) : null}


{variant === "split" ? (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

    <label className="block">
      <div className="text-sm text-[rgb(var(--db-text))] mb-2">Image side</div>
      <select
        className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
        value={imageSide}
        onChange={(e) => setImageSide(e.target.value as any)}
      >
        <option value="right">Right</option>
        <option value="left">Left</option>
      </select>
    </label>

    <label className="block">
      <div className="text-sm text-[rgb(var(--db-text))] mb-2">Image size</div>
      <select
        className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
        value={imageSize ?? "md"}
        onChange={(e) => setImageSize(e.target.value as any)}
      >
        <option value="xs">X-Small</option>
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
        <option value="xl">X-Large</option>
        <option value="2xl">2X-Large</option>
      </select>
    </label>

    <label className="block">
      <div className="text-sm text-[rgb(var(--db-text))] mb-2">Image ratio</div>
      <select
        className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
        value={imageRatio ?? "square"}
        onChange={(e) => setImageRatio(e.target.value as any)}
      >
        <option value="square">Square (1:1)</option>
        <option value="4:3">4:3</option>
        <option value="16:9">16:9</option>
        <option value="3:4">3:4</option>
        <option value="9:16">9:16</option>
        <option value="auto">Auto</option>
      </select>
    </label>
  </div>
) : null}


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <div className="text-sm text-[rgb(var(--db-text))] mb-2">Title size</div>
          <select
            className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
            value={titleSize ?? "lg"}
            onChange={(e) => setTitleSize(e.target.value as any)}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm text-[rgb(var(--db-text))] mb-2">Subtitle size</div>
          <select
            className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
            value={subtitleSize ?? "md"}
            onChange={(e) => setSubtitleSize(e.target.value as any)}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm text-[rgb(var(--db-text))] mb-2">Align</div>
          <select
            className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
            value={align ?? "center"}
            onChange={(e) => setAlign(e.target.value as any)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        {variant === "background" ? (
    <label className="block">
      <div className="text-sm text-[rgb(var(--db-text))] mb-2">Vertical align</div>
      <select
        className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
        value={verticalAlign ?? "center"}
        onChange={(e) => setVerticalAlign(e.target.value as any)}
      >
        <option value="top">Top</option>
        <option value="center">Center</option>
        <option value="bottom">Bottom</option>
      </select>
    </label>
  ) : null}
      </div>

      <div
        style={{
          background: "var(--card-bg)",
          border: "var(--card-border)",
          boxShadow: "var(--card-shadow)",
          padding: "var(--card-padding)",
          borderRadius: "var(--button-radius)",
        }}
        className="space-y-2 min-w-0"
      >
        <div className="text-xs text-[rgb(var(--db-muted))]">Preview</div>
        <div
          className={`space-y-1 ${alignClass} min-w-0`}
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
        >
          <div className={`${titleClass} font-bold text-[rgb(var(--text))]`}>
            {safeTrim(title) ? title : "Your title…"}
          </div>
          {safeTrim(subtitle) ? (
            <div className={`${subtitleClass} text-[rgb(var(--muted))]`}>{subtitle}</div>
          ) : (
            <div className={`${subtitleClass} text-[rgb(var(--muted))] opacity-60`}>Your subtitle…</div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={saving || !safeTrim(title)}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                content: {
  title: safeTrim(title),
  subtitle: safeTrim(subtitle),
  avatar: safeTrim(avatar) ? safeTrim(avatar) : null,
  title_size: titleSize ?? "lg",
  subtitle_size: subtitleSize ?? "md",
  align: (align as any) ?? "center",
vertical_align: (verticalAlign as any) ?? "center",

image_side: imageSide,

  image_size: imageSize,
  image_ratio: imageRatio,

  bg_height: bgHeight,
bg_radius: bgRadius,


  primary_button_title: safeTrim(primaryBtnTitle),
  primary_button_url: safeTrim(primaryBtnUrl),
  secondary_button_title: safeTrim(secondaryBtnTitle),
  secondary_button_url: safeTrim(secondaryBtnUrl),
},

                variant,
              });
              
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}



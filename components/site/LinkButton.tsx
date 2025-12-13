import Link from "next/link";

type ButtonStyle = "solid" | "outline" | "soft";

export function LinkButton({
  href,
  label,
  buttonStyle = "solid",
}: {
  href: string;
  label: string;
  buttonStyle?: ButtonStyle;
}) {
  const base =
    "w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.35)]";

  const radius = "rounded-2xl";

  const variant =
    buttonStyle === "outline"
      ? "border border-[rgb(var(--border))] bg-transparent hover:bg-[rgb(var(--text)/0.06)] text-[rgb(var(--text))]"
      : buttonStyle === "soft"
      ? "border border-[rgb(var(--border))] bg-[rgb(var(--primary)/0.14)] hover:bg-[rgb(var(--primary)/0.22)] text-[rgb(var(--text))]"
      : "border border-transparent bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.88)] text-white";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${radius} ${variant}`}
    >
      {label}
    </Link>
  );
}

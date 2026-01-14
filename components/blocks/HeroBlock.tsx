"use client";

export default function HeroBlock({
  title,
  subtitle,
  background,
  avatar,
}: any) {
  return (
    <section
      style={{
        backgroundImage: background ? `url(${background})` : undefined,
        backgroundSize: background ? "cover" : undefined,
        backgroundPosition: background ? "center" : undefined,
        backgroundRepeat: background ? "no-repeat" : undefined,
        borderRadius: "var(--radius, 15px)",
      }}
      className="w-full p-8 text-center"
    >
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
      ) : null}

      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="opacity-70 mt-2">{subtitle}</p>
    </section>
  );
}

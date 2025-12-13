export default function HeroBlock({
  title,
  subtitle,
  background,
  avatar,
}: any) {
  return (
    <section
      style={{
        backgroundImage: background ? \`url(\${background})\` : undefined,
      }}
      className="p-8 text-center rounded-xl"
    >
      {avatar && (
        <img
          src={avatar}
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
      )}
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="opacity-70 mt-2">{subtitle}</p>
    </section>
  );
}

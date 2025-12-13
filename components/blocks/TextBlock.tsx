export default function TextBlock({ text, align }: any) {
  return (
    <p className={\`my-6 text-\${align || "left"}\`}>
      {text}
    </p>
  );
}

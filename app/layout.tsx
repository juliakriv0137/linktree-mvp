import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link Page MVP",
  description: "A Linktree-like MVP built with Next.js + Supabase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Эти значения читаются на СЕРВЕРЕ и безопасно прокидываются в браузер
  const clientEnv = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  };

  return (
    <html lang="en">
      <body>
        {/* 
          Гарантированно прокидываем env в клиент,
          даже если Next по какой-то причине не заинлайнил process.env
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__LINKTREE_ENV__ = ${JSON.stringify(clientEnv)};`,
          }}
        />
        {children}
      </body>
    </html>
  );
}


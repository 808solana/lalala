import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Love AI",
  description: "A warm, simple answer engine powered by OpenRouter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-[#0d0c12]">
        {children}
      </body>
    </html>
  );
}

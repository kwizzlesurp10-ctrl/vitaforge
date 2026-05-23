import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitaForge • AI Biohacking for Peak 2026 Performers",
  description:
    "Personalized neurotransmitter optimization, NAD+ precursors & circadian-aligned nootropics. Get your AI Biohack Scan.",
  openGraph: {
    title: "VitaForge • AI-Powered Biohacking",
    description:
      "The only AI-personalized protocol engineered for founders, executives & athletes who refuse average performance.",
    images: ["/og-1200x630.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-200 overflow-x-hidden">{children}</body>
    </html>
  );
}

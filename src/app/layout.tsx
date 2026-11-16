import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HEDGEROW — Asymmetric Alpha & Anti-Short Engine on Robinhood Chain",
  description:
    "The sweetest asymmetric alpha lab on Robinhood Chain (Arbitrum L2, Chain ID 4663). We bake short-squeezes fresh out of the oven for retail outlaws.",
  keywords: [
    "Robinhood Chain",
    "L2",
    "Hedgerow",
    "WEALD",
    "RWA",
    "Tokenized Equities",
    "DeFi",
    "Arbitrum Orbit",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-pink selection:text-navy">
        {children}
      </body>
    </html>
  );
}

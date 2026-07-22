import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealChef — Good deals, great dinners",
  description: "Personalized half-price grocery deals and recipe ideas for your week.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

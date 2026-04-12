import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymFlow — Command Centre",
  description: "Next-gen Gym Management SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="mesh-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}

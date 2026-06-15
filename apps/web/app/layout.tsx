import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IG Tracker",
  description: "Monitoreá seguidores y seguidos de Instagram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

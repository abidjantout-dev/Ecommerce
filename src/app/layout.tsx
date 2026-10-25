import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moïva",
  description: "Boutique et suivi des commandes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;900&family=Figtree:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-corps bg-nuit text-texte antialiased">{children}</body>
    </html>
  );
}

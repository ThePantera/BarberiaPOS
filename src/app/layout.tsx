import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Grovee Admin",
  description: "Caja, clientes y fidelización para tu barbería",
};

export const viewport: Viewport = {
  themeColor: "#17150f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}

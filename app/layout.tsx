import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "PDFMaster — Free PDF Tools",
  description: "30+ free PDF tools. Merge, split, compress, convert, sign and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0a0a", margin: 0 }}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
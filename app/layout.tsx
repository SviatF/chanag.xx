import type { Metadata } from "next";
import "./globals.css";
import "./internal-pages.css";

export const metadata: Metadata = {
  metadataBase:new URL("https://panchang.in"),
  title:{default:"Panchang — Precise Hindu Calendar & Muhurat",template:"%s | Panchang"},
  description:"Hyperlocal Hindu Panchang, auspicious timings, Rahu Kalam, festivals and Muhurat for cities across India.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>
}

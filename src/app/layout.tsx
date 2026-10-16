import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Inter, Martian_Mono } from "next/font/google";
import { InitialAppLoader } from "@/components/ui/initial-loader";
import "./globals.css";

const barlowCondensed = Barlow_Semi_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const martianMono = Martian_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simmory — The way they made it, remembered.",
  description:
    "Preserve family cooking knowledge, traditional recipes, sensory cues, and original demonstration videos in a private culinary archive.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${inter.variable} ${martianMono.variable} h-full antialiased scroll-smooth scroll-pt-20 sm:scroll-pt-24`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F2F2EB] text-[#202723] selection:bg-[#2E4742] selection:text-[#F2F2EB]">
        <InitialAppLoader />
        {children}
      </body>
    </html>
  );
}

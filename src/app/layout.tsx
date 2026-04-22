import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YCWorthy — AI Startup Evaluator",
  description:
    "Get a brutal, honest AI evaluation of any startup against Y Combinator's real funding criteria.",
  applicationName: "YCWorthy",
  authors: [
    { name: "Girish Hiremath", url: "https://girishbhiremath.vercel.app/" },
    { name: "IntelliForge AI", url: "https://www.intelliforge.tech/" },
  ],
  creator: "IntelliForge AI",
  publisher: "IntelliForge AI",
  keywords: [
    "Y Combinator",
    "YC",
    "startup evaluator",
    "AI startup analysis",
    "NVIDIA Nemotron",
    "Gemini",
    "founder-market fit",
    "IntelliForge AI",
  ],
  openGraph: {
    title: "YCWorthy — AI Startup Evaluator",
    description: "Is your startup YC-worthy? Find out in 30 seconds.",
    type: "website",
    siteName: "YCWorthy",
  },
  twitter: {
    card: "summary_large_image",
    title: "YCWorthy — AI Startup Evaluator",
    description: "Is your startup YC-worthy? Find out in 30 seconds.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="m-0 p-0 bg-yc-bg text-yc-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

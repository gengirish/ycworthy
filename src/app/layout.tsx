import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YCWorthy — AI Startup Evaluator",
  description:
    "Get a brutal, honest AI evaluation of any startup against Y Combinator's real funding criteria.",
  openGraph: {
    title: "YCWorthy",
    description: "Is your startup YC-worthy? Find out in 30 seconds.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="m-0 p-0 bg-yc-bg text-yc-text">{children}</body>
    </html>
  );
}

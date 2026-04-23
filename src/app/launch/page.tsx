import type { Metadata } from "next";
import { LaunchHub } from "@/components/LaunchHub";

export const metadata: Metadata = {
  title: "YCWorthy — Launch Hub",
  description:
    "Launch assets for YCWorthy: 6-second demo script, 6-slide carousel copy, Show HN + Product Hunt posts, hashtag bundles, and a live verdict-card OG image generator.",
  openGraph: {
    title: "YCWorthy — Launch Hub",
    description:
      "Demo script, carousel copy, Show HN, Product Hunt, and a live verdict-card generator.",
    images: [
      {
        url: "/api/og?grade=S&company=YCWorthy&score=98&tagline=Launch+the+launch.+Not+the+demo+deck.",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YCWorthy — Launch Hub",
    description: "Everything you need to launch YCWorthy in one page.",
    images: [
      "/api/og?grade=S&company=YCWorthy&score=98&tagline=Launch+the+launch.+Not+the+demo+deck.",
    ],
  },
};

export default function LaunchPage() {
  return <LaunchHub />;
}

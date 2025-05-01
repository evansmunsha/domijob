import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Metadata } from "next";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function constructMetadata({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}): Metadata {
  // Base site URL
  const metadataBase = new URL("https://domijob.vercel.app");
  // Preserve referral parameter if provided (e.g. /?ref=CODE)
  const refCode = searchParams?.ref;
  const pageUrl = refCode
    ? `${metadataBase.toString()}?ref=${encodeURIComponent(refCode)}`
    : metadataBase.toString();

  // Title and description with AI emphasis and target audience
  const title = "Domijob | AI-Powered Job Board for Job Seekers & Recruiters";
  const description =
    "Domijob is an AI-driven job board connecting job seekers and recruiters. Find your next opportunity or hire top talent efficiently.";

  // Preview image for social sharing (1200x630px recommended&#8203;:contentReference[oaicite:9]{index=9})
  const imageUrl = new URL("/logo.png", metadataBase);

  return {
    title,
    description,
    // Include relevant keywords for SEO
    keywords: [
      "AI job board",
      "recruitment",
      "talent matching",
      "job search",
      "hiring",
      "career",
      "recruiters",
      "job seekers",
    ],
    // Base URL for Open Graph and other tags
    metadataBase,
    // Open Graph tags
    openGraph: {
      title,
      description,
      // Use the full URL including ref if present
      url: pageUrl,
      siteName: "Domijob",
      type: "website",
      images: [
        {
          url: imageUrl.toString(),
          width: 1200,
          height: 630,
          alt: "Illustration of Domijob's AI-powered job matching platform connecting job seekers with recruiters",
        },
      ],
    },
    // Twitter card tags
    twitter: {
      card: "summary_large_image",
      title,
      description,
      // Summary card with large image&#8203;:contentReference[oaicite:10]{index=10}
      images: [imageUrl.toString()],
      // (Optional) add a Twitter handle if available, e.g. creator: "@DomijobAI"
    },
    // Favicon and icons
    icons: {
      icon: "/favicon.ico",
      // You can add other icons like Apple Touch here if needed
    },
  };
}

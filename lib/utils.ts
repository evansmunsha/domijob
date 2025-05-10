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
  const base = "https://domijob.vercel.app";
  const metadataBase = new URL(base);

  // Preserve referral parameter if provided (e.g., /?ref=CODE)
  const refCode = searchParams?.ref;
  const page = searchParams?.page;
  const jobTypes = searchParams?.jobTypes;
  const location = searchParams?.location;

  // Construct the canonical path with only meaningful query parameters
  const url = new URL(base);
  if (refCode) url.searchParams.set("ref", refCode);
  if (page) url.searchParams.set("page", page);
  if (jobTypes) url.searchParams.set("jobTypes", jobTypes);
  if (location) url.searchParams.set("location", location);

  const title = "Domijob | AI-Powered Job Board for Job Seekers & Recruiters";
  const description =
    "Domijob is an AI-driven job board connecting job seekers and recruiters. Find your next opportunity or hire top talent efficiently.";

  const imageUrl = new URL("/logo.png", metadataBase);

  const breadcrumbList = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: base,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Job Listings",
      item: url.toString(), // This would be your current page URL with parameters
    },
  ];

  return {
    title,
    description,
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
    metadataBase,
    openGraph: {
      title,
      description,
      url: url.toString(), // Share URL with tracking/ref params
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
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl.toString()],
    },
    icons: {
      icon: "/favicon.ico",
    },
    alternates: {
      canonical: `${base}${
        page || jobTypes || location
          ? `?${new URLSearchParams({
              ...(page && { page }),
              ...(jobTypes && { jobTypes }),
              ...(location && { location }),
            }).toString()}`
          : ""
      }`,
    },
    
  };
}

import { Metadata } from "next";

export type ConstructMetadataArgs = {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
  searchParams?: Record<string, string>;
  ogType?: 
    | "article"
    | "website"
    | "book"
    | "profile"
    | "music.song"
    | "music.album"
    | "music.playlist"
    | "music.radio_station"
    | "video.movie"
    | "video.episode"
    | "video.tv_show"
    | "video.other";
};

export function useDynamicMetadata({
  title = "Domijob | AI-Powered Job Board for Job Seekers & Recruiters",
  description = "Domijob helps you find your next career opportunity or recruit top talent using AI-powered job matching.",
  image = "/logo.png",
  icons = "/favicon.ico",
  noIndex = false,
  searchParams = {},
  ogType = "website",
}: ConstructMetadataArgs): Metadata {

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://domijob.vercel.app";

  // Compose canonical URL with optional search params
  const url = new URL(baseUrl);
  for (const key in searchParams) {
    url.searchParams.set(key, searchParams[key]);
  }

  const imageUrl = new URL(image, baseUrl);

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    robots: noIndex ? { index: false, follow: true } : undefined,
    icons: {
      icon: icons,
      shortcut: icons,
      apple: icons,
    },
    openGraph: {
      title,
      description,
      url: url.toString(),
      siteName: "Domijob",
      type: ogType,
      images: [
        {
          url: imageUrl.toString(),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl.toString()],
    },
  };
}

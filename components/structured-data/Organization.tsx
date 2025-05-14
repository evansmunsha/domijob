"use client"

interface OrganizationProps {
  company: {
    id: string
    name: string
    logo: string | null
    website?: string
    about?: string
    socialLinks?: {
      facebook?: string
      twitter?: string
      linkedin?: string
    }
  }
}

export function OrganizationStructuredData({ company }: OrganizationProps) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://domijob.vercel.app"

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.website || `${baseUrl}/companies/${company.id}`,
    logo: company.logo || `https://avatar.vercel.sh/${company.name}`,
    description: company.about || `${company.name} is a company on Domijob.`,
    sameAs: [company.socialLinks?.facebook, company.socialLinks?.twitter, company.socialLinks?.linkedin].filter(
      Boolean,
    ),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  )
}

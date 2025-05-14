"use client"

interface JobPostingProps {
  job: {
    id: string
    jobTitle: string
    jobDescription: string
    employmentType: string
    location: string
    createdAt: string
    listingDuration: number
    company: {
      id: string
      name: string
      logo: string | null
    }
  }
}

export function JobPostingStructuredData({ job }: JobPostingProps) {
  // Strip HTML tags from description
  const plainDescription = job.jobDescription.replace(/<[^>]+>/g, "")

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.jobTitle,
    description: plainDescription,
    datePosted: new Date(job.createdAt).toISOString(),
    validThrough: new Date(new Date(job.createdAt).getTime() + job.listingDuration * 86400000).toISOString(),
    employmentType: job.employmentType.toUpperCase(),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      sameAs: `${process.env.NEXT_PUBLIC_URL || "https://domijob.vercel.app"}/companies/${job.company.id}`,
      logo: job.company.logo || `https://avatar.vercel.sh/${job.company.name}`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "KE", // or dynamically based on country data
      },
    },
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

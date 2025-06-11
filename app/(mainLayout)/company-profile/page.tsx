import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { CompanyProfileForm } from "@/components/forms/company/CompanyProfileForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CompanyProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Verify user is a company
  if (session.user.userType !== "COMPANY") {
    redirect("/dashboard")
  }

  // Get the company
  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  })

  if (!company) {
    redirect("/onboarding")
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Company Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Edit Company Profile</CardTitle>
          <CardDescription>Update your company information visible to job seekers</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyProfileForm
            initialData={{
              name: company.name,
              about: company.about || "",
              industry: company.industry || "",
              location: company.location || "",
              website: company.website || "",
              size: company.size || "",
              foundedYear: company.foundedYear || "",
              xAccount: company.xAccount || "",
              logo: company.logo || "",
            }}
            companyId={company.id}
          />
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <a
          href={`/companies/${company.id}`}
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View public profile
        </a>
      </div>
    </div>
  )
}


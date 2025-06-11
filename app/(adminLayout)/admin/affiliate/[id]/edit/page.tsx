import { prisma } from "@/app/utils/db"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"
import Link from "next/link"
import AffiliateEditForm from "@/components/admin/AffiliateEditForm"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Edit Affiliate | Admin Dashboard",
  description: "Edit affiliate details and commission rates",
}

export default async function EditAffiliatePage({ params }: { params: { id: string } }) {
  const session = await auth()
  
  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/")
  }

  const affiliateId = params.id
  
  // Fetch affiliate with user data
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        }
      }
    }
  })

  if (!affiliate) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={`/admin/affiliate/${affiliate.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Affiliate</h1>
      </div>
      
      <AffiliateEditForm affiliate={affiliate} />
    </div>
  )
} 
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ArrowLeft, Mail, Calendar, User, Building, Briefcase, CreditCard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "User Details",
  description: "View and manage user details",
}

export default async function UserPage({
  params,
}: {
  params: { userId: string }
}) {
  const session = await auth()
  
  // Check if the user is authenticated and is an admin
  if (!session?.user || session.user.userType !== "ADMIN") {
    redirect("/")
  }
  
  // Get the user with related data
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      Company: true,
      JobSeeker: true,
      affiliate: true
    }
  })
  
  if (!user) {
    notFound()
  }
  
  const initials = user.name 
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user.email[0].toUpperCase()
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>User Profile</CardTitle>
              <Badge variant={
                user.userType === "ADMIN" 
                  ? "destructive" 
                  : user.userType === "COMPANY" 
                    ? "secondary" 
                    : "default"
              }>
                {user.userType?.replace("_", " ") || "JOB SEEKER"}
              </Badge>
            </div>
            <CardDescription>View and manage user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.image || ""} alt={user.name || user.email} />
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">{user.name || "Unnamed User"}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Email Verification: </span>
                    <Badge variant={user.emailVerified ? "default" : "outline"}>
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Joined: </span>
                    <span>{format(new Date(user.createdAt), "PPP")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Onboarding: </span>
                    <Badge variant={user.onboardingCompleted ? "default" : "outline"}>
                      {user.onboardingCompleted ? "Completed" : "Incomplete"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Stripe Customer: </span>
                    <span>{user.stripeCustomerId || "Not linked"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {user.userType === "COMPANY" && user.Company && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Company profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company Name
                  </h3>
                  <p>{user.Company.name}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Industry</h3>
                  <p>{user.Company.industry || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p>{user.Company.location}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Website</h3>
                  <p>{user.Company.website}</p>
                </div>
                
                <div className="col-span-2">
                  <h3 className="font-medium">About</h3>
                  <p className="line-clamp-3">{user.Company.about}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {user.userType === "JOB_SEEKER" && user.JobSeeker && (
          <Card>
            <CardHeader>
              <CardTitle>Job Seeker Information</CardTitle>
              <CardDescription>Job seeker profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Profile Name
                  </h3>
                  <p>{user.JobSeeker.name}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Skills</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.JobSeeker.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium">Preferred Locations</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.JobSeeker.preferredLocations.map((location, i) => (
                      <Badge key={i} variant="outline">{location}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium">Remote Only</h3>
                  <p>{user.JobSeeker.remoteOnly ? "Yes" : "No"}</p>
                </div>
                
                <div className="col-span-2">
                  <h3 className="font-medium">About</h3>
                  <p className="line-clamp-3">{user.JobSeeker.about}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {user.affiliate && (
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Information</CardTitle>
              <CardDescription>Affiliate program details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Affiliate Code</h3>
                  <p>{user.affiliate.code}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Commission Rate</h3>
                  <p>{(user.affiliate.commissionRate * 100).toFixed(0)}%</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Total Earnings</h3>
                  <p>${user.affiliate.totalEarnings.toFixed(2)}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Pending Earnings</h3>
                  <p>${user.affiliate.pendingEarnings.toFixed(2)}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Conversions</h3>
                  <p>{user.affiliate.conversionCount}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Clicks</h3>
                  <p>{user.affiliate.clickCount}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Payment Method</h3>
                  <p className="capitalize">{user.affiliate.paymentMethod}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResumeSection } from "@/components/profile/ResumeSection"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { SkillsSection } from "@/components/profile/SkillsSection"
import { LanguagesSection } from "@/components/profile/LanguagesSection"
import { ProfileForm } from "@/components/forms/profile/ProfileForm"
import { SkillGapAnalysis } from "@/components/profile/SkillGapAnalysis"

async function getJobSeekerProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      JobSeeker: true,
    },
  })
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await getJobSeekerProfile(session.user.id)

  if (!user?.JobSeeker) {
    redirect("/onboarding")
  }

  // Define initialPreferences based on the JobSeeker data

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <ProfileHeader
        name={user.JobSeeker.name}
        email={user.email}
        image={user.image || undefined}
        resumeUrl={user.JobSeeker.resume}
      />

      <Tabs defaultValue="profile" className="mt-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal information and professional summary</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                initialData={{
                  name: user.JobSeeker.name,
                  about: user.JobSeeker.about,
                  email: user.email,
                  skills: user.JobSeeker.skills || [],
                  languages: user.JobSeeker.languages || [],
                }}
                userId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Add and manage your professional skills</CardDescription>
            </CardHeader>
            <CardContent>
              <SkillsSection userId={user.id} initialSkills={user.JobSeeker.skills || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>Add languages you speak</CardDescription>
            </CardHeader>
            <CardContent>
              <LanguagesSection userId={user.id} initialLanguages={user.JobSeeker.languages || []} />
            </CardContent>
          </Card>
        </TabsContent>

        

        <TabsContent value="resume" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Resume Management</CardTitle>
              <CardDescription>Upload and manage your resume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeSection resumeUrl={user.JobSeeker.resume} userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add the SkillGapAnalysis component with the correct props */}
      <SkillGapAnalysis userId={user.id} currentSkills={user.JobSeeker.skills || []} />

      
    </div>
  )
}


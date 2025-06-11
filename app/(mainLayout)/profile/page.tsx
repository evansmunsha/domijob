import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResumeSection } from "@/components/profile/ResumeSection"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { SkillsSection } from "@/components/profile/SkillsSection"
import { LanguagesSection } from "@/components/profile/LanguagesSection"
import { ProfileForm } from "@/components/forms/profile/ProfileForm"
import { SkillGapAnalysis } from "@/components/profile/SkillGapAnalysis"
import { ScrollableTabs } from "./ScrollableTabs"

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

  const profileContent = (
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
  )

  const skillsContent = (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>Add and manage your professional skills</CardDescription>
      </CardHeader>
      <CardContent>
        <SkillsSection userId={user.id} initialSkills={user.JobSeeker.skills || []} />
      </CardContent>
    </Card>
  )

  const languagesContent = (
    <Card>
      <CardHeader>
        <CardTitle>Languages</CardTitle>
        <CardDescription>Add languages you speak</CardDescription>
      </CardHeader>
      <CardContent>
        <LanguagesSection userId={user.id} initialLanguages={user.JobSeeker.languages || []} />
      </CardContent>
    </Card>
  )

 

  const resumeContent = (
    <Card>
      <CardHeader>
        <CardTitle>Resume Management</CardTitle>
        <CardDescription>Upload and manage your resume</CardDescription>
      </CardHeader>
      <CardContent>
        <ResumeSection resumeUrl={user.JobSeeker.resume} userId={user.id} />
      </CardContent>
    </Card>
  )

  const tabItems = [
    { value: "profile", label: "Profile", content: profileContent },
    { value: "skills", label: "Skills", content: skillsContent },
    { value: "languages", label: "Languages", content: languagesContent },
    { value: "resume", label: "Resume", content: resumeContent },
  ]

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <ProfileHeader
        name={user.JobSeeker.name}
        email={user.email}
        image={user.image || undefined}
        resumeUrl={user.JobSeeker.resume}
      />

      <ScrollableTabs defaultValue="profile" tabItems={tabItems} children={undefined} />

      {/* Add the SkillGapAnalysis component with the correct props */}
      <SkillGapAnalysis userId={user.id} currentSkills={user.JobSeeker.skills || []} />

    </div>
  )
}

import { auth } from "@/app/utils/auth";
import { prisma } from "@/app/utils/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: { id: string };
};

export async function generateStaticParams() {
  const jobSeekers = await prisma.jobSeeker.findMany({
    select: { id: true }, // Fetch all job seeker IDs
  });

  return jobSeekers.map((jobSeeker) => ({
    id: jobSeeker.id, // Map each job seeker ID
  }));
}


export const dynamic = "force-dynamic"; // This route depends on session

async function getJobSeeker(id: string) {
  const jobSeeker = await prisma.jobSeeker.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!jobSeeker) notFound();
  return jobSeeker;
}

async function checkApplicationStatus(jobSeekerId: string, companyId: string) {
  const application = await prisma.jobApplication.findFirst({
    where: {
      userId: jobSeekerId,
      job: {
        companyId,
      },
    },
  });

  return !!application;
}

export default async function JobSeekerProfile({ params }: Props) {
  const session = await auth();
  const jobSeeker = await getJobSeeker(params.id);

  let canViewFullProfile = false;

  if (session?.user?.userType === "COMPANY" && session.user.companyId) {
    canViewFullProfile = await checkApplicationStatus(
      jobSeeker.userId,
      session.user.companyId
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={jobSeeker.user.image || `https://avatar.vercel.sh/${jobSeeker.name}`}
                alt={jobSeeker.name}
              />
              <AvatarFallback>
                {jobSeeker.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{jobSeeker.name}</CardTitle>
              <p className="text-muted-foreground">{jobSeeker.user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {canViewFullProfile ? (
            <div className="space-y-6">
              <section>
                <h3 className="font-semibold mb-2">About</h3>
                <p>{jobSeeker.about}</p>
              </section>

              {jobSeeker.skills?.length > 0 && (
                <section>
                  <h3 className="font-semibold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobSeeker.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {jobSeeker.languages?.length > 0 && (
                <section>
                  <h3 className="font-semibold mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobSeeker.languages.map((lang, index) => (
                      <Badge key={index} variant="outline">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {session?.user?.userType === "COMPANY"
                  ? "Full profile is only visible for applicants to your job postings."
                  : "You need to be logged in as a company to view full job seeker profiles."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


import { redirect } from "next/navigation"
import { ApplicationInsights } from "@/components/job/ApplicationInsights"
import { prisma } from "@/app/utils/db"
import { requireUser } from "@/app/utils/hooks"
import { auth } from "@/app/utils/auth"

interface Props {
  params: {
    jobId: string
  }
}

const JobPage = async ({ params: { jobId } }: Props) => {
  if (!jobId) {
    redirect("/")
  }

  const session = await auth()

  const job = await prisma.jobPost.findUnique({
    where: {
      id: jobId,
    },
    include: {
      company: true,
    },
  })

  if (!job) {
    redirect("/")
  }

  let hasApplied = false

  if (session?.user) {
    hasApplied = !!(await prisma.jobApplication.findFirst({
      where: {
        jobId: job.id,
        userId: session.user.id,
      },
    }))
  }

  return (
    <div className="container py-10 grid grid-cols-4 gap-5">
      
      <div className="col-span-1">
        {session?.user && hasApplied && <ApplicationInsights jobId={jobId} />}
      </div>
    </div>
  )
}

export default JobPage


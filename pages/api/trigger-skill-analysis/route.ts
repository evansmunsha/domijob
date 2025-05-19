import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { inngest } from "@/app/utils/inngest/client"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, targetJobTitle } = await req.json()

    // Verify the user has permission to trigger this for the given userId
    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Trigger the Inngest function
    await inngest.send({
      name: "user/request.skill-gap-analysis",
      data: {
        userId,
        targetJobTitle,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error triggering skill gap analysis:", error)
    return NextResponse.json({ error: "Failed to trigger skill gap analysis" }, { status: 500 })
  }
}


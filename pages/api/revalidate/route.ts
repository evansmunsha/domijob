import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    // Check for secret to confirm this is a valid request
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: "Invalid revalidation secret" }, { status: 401 })
    }

    // Get path or tag from the request body
    const body = await request.json()

    if (body.path) {
      // Revalidate the specific path
      revalidatePath(body.path)
      return NextResponse.json({
        revalidated: true,
        message: `Path ${body.path} revalidated`,
      })
    }

    if (body.tag) {
      // Revalidate based on cache tag
      revalidateTag(body.tag)
      return NextResponse.json({
        revalidated: true,
        message: `Tag ${body.tag} revalidated`,
      })
    }

    // If neither path nor tag is provided
    return NextResponse.json({ message: "No path or tag provided for revalidation" }, { status: 400 })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 })
  }
}

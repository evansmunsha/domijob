import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"
import { auth } from "@/app/utils/auth"

export async function GET() {
  try {
    console.log("Admin Comments Test: Starting...")
    
    const session = await auth()
    console.log("Admin Comments Test: Session:", {
      hasUser: !!session?.user,
      userType: session?.user?.userType,
      userId: session?.user?.id
    })

    if (!session?.user || session.user.userType !== "ADMIN") {
      console.log("Admin Comments Test: Not admin, returning error")
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    console.log("Admin Comments Test: User is admin, fetching comments...")
    
    // First, let's try a simple query without any includes
    const simpleComments = await prisma.blogComment.findMany({
      where: {
        parentId: null
      }
    })
    
    console.log("Admin Comments Test: Simple query result:", {
      total: simpleComments.length,
      firstComment: simpleComments[0] ? {
        id: simpleComments[0].id,
        content: simpleComments[0].content,
        approved: simpleComments[0].approved
      } : null
    })

    // Now try the full query (exact same as admin page)
    const comments = await prisma.blogComment.findMany({
      where: {
        parentId: null // Only top-level comments
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: [
        { approved: "asc" },
        { createdAt: "desc" }
      ]
    })

    console.log("Admin Comments Test: Full query result:", {
      total: comments.length,
      approved: comments.filter(c => c.approved).length,
      pending: comments.filter(c => !c.approved).length,
      firstComment: comments[0] ? {
        id: comments[0].id,
        content: comments[0].content,
        approved: comments[0].approved,
        author: comments[0].author?.name,
        post: comments[0].post?.title
      } : null
    })

    return NextResponse.json({
      session: {
        hasUser: !!session?.user,
        userType: session?.user?.userType,
        userId: session?.user?.id
      },
      simpleQuery: {
        total: simpleComments.length,
        firstComment: simpleComments[0] ? {
          id: simpleComments[0].id,
          content: simpleComments[0].content,
          approved: simpleComments[0].approved
        } : null
      },
      fullQuery: {
        total: comments.length,
        approved: comments.filter(c => c.approved).length,
        pending: comments.filter(c => !c.approved).length,
        firstComment: comments[0] ? {
          id: comments[0].id,
          content: comments[0].content,
          approved: comments[0].approved,
          author: comments[0].author?.name,
          post: comments[0].post?.title
        } : null
      }
    })
  } catch (error) {
    console.error("Admin Comments Test: Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments", details: error },
      { status: 500 }
    )
  }
} 
import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    console.log("Test API: Fetching comments...")
    
    // Get all comments without any filters
    const allComments = await prisma.blogComment.findMany({
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
        }
      }
    })

    console.log("Test API: Found comments:", {
      total: allComments.length,
      approved: allComments.filter(c => c.approved).length,
      pending: allComments.filter(c => !c.approved).length
    })

    // Get only top-level comments (parentId is null)
    const topLevelComments = await prisma.blogComment.findMany({
      where: {
        parentId: null
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
        }
      }
    })

    console.log("Test API: Top-level comments:", {
      total: topLevelComments.length,
      approved: topLevelComments.filter(c => c.approved).length,
      pending: topLevelComments.filter(c => !c.approved).length
    })

    return NextResponse.json({
      allComments: allComments.length,
      topLevelComments: topLevelComments.length,
      approved: topLevelComments.filter(c => c.approved).length,
      pending: topLevelComments.filter(c => !c.approved).length,
      sampleComment: topLevelComments[0] ? {
        id: topLevelComments[0].id,
        content: topLevelComments[0].content,
        approved: topLevelComments[0].approved,
        author: topLevelComments[0].author?.name,
        post: topLevelComments[0].post?.title
      } : null
    })
  } catch (error) {
    console.error("Test API: Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments", details: error },
      { status: 500 }
    )
  }
} 
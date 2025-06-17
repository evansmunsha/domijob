import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/db"

export async function GET() {
  try {
    console.log("🔍 Testing comments query...")
    
    // Simple count query
    const totalComments = await prisma.blogComment.count()
    console.log(`📊 Total comments in database: ${totalComments}`)
    
    // Count by approval status
    const approvedComments = await prisma.blogComment.count({
      where: { approved: true }
    })
    const pendingComments = await prisma.blogComment.count({
      where: { approved: false }
    })
    
    console.log(`✅ Approved comments: ${approvedComments}`)
    console.log(`⏳ Pending comments: ${pendingComments}`)
    
    // Get a few sample comments
    const sampleComments = await prisma.blogComment.findMany({
      take: 5,
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    console.log(`📝 Sample comments:`, sampleComments.map(c => ({
      id: c.id,
      content: c.content.substring(0, 50) + "...",
      approved: c.approved,
      author: c.author?.name || "Anonymous",
      post: c.post?.title || "Unknown"
    })))
    
    return NextResponse.json({
      success: true,
      stats: {
        total: totalComments,
        approved: approvedComments,
        pending: pendingComments
      },
      sampleComments: sampleComments.map(c => ({
        id: c.id,
        content: c.content,
        approved: c.approved,
        author: c.author?.name || "Anonymous",
        post: c.post?.title || "Unknown",
        createdAt: c.createdAt
      }))
    })
  } catch (error) {
    console.error("❌ Error in test endpoint:", error)
    return NextResponse.json({ error: "Database error", details: error }, { status: 500 })
  }
} 
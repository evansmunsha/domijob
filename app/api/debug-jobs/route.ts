import { NextResponse } from "next/server";
import { prisma } from "@/app/utils/db";

export async function GET() {
  try {
    // Check total jobs
    const totalJobs = await prisma.jobPost.count();
    
    // Check active jobs
    const activeJobs = await prisma.jobPost.count({
      where: { status: "ACTIVE" }
    });
    
    // Check recent active jobs (last 90 days)
    const recentActiveJobs = await prisma.jobPost.count({
      where: { 
        status: "ACTIVE",
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Get sample jobs
    const sampleJobs = await prisma.jobPost.findMany({
      where: { 
        status: "ACTIVE",
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        company: { 
          select: { 
            name: true, 
            location: true 
          } 
        },
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Check job statuses
    const jobStatuses = await prisma.jobPost.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    return NextResponse.json({
      summary: {
        totalJobs,
        activeJobs,
        recentActiveJobs,
        jobStatuses
      },
      sampleJobs: sampleJobs.map(job => ({
        id: job.id,
        title: job.jobTitle,
        company: job.company?.name,
        status: job.status,
        createdAt: job.createdAt,
        descriptionLength: job.jobDescription?.length || 0,
        hasDescription: !!job.jobDescription,
        salaryFrom: job.salaryFrom,
        salaryTo: job.salaryTo,
        location: job.location || job.company?.location
      }))
    });
    
  } catch (error) {
    console.error("Debug jobs error:", error);
    return NextResponse.json({
      error: "Failed to fetch job data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

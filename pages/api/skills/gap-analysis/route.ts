import { NextResponse } from "next/server"
import { auth } from "@/app/utils/auth"
import { prisma } from "@/app/utils/db"

// Common tech skills with descriptions
const skillDatabase = {
  javascript: {
    name: "JavaScript",
    description: "Core programming language for web development, essential for frontend and backend.",
    demandLevel: "high",
    resources: [
      { id: "1", title: "MDN JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", type: "Documentation" },
      { id: "2", title: "JavaScript.info", url: "https://javascript.info/", type: "Tutorial" },
    ],
  },
  typescript: {
    name: "TypeScript",
    description: "Strongly typed programming language that builds on JavaScript.",
    demandLevel: "high",
    resources: [
      { id: "1", title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html", type: "Documentation" },
      { id: "2", title: "TypeScript Deep Dive", url: "https://basarat.gitbook.io/typescript/", type: "Book" },
    ],
  },
  python: {
    name: "Python",
    description: "Popular general-purpose programming language used in web development, data science, and automation.",
    demandLevel: "high",
    resources: [
      { id: "1", title: "Python Official Docs", url: "https://docs.python.org/3/", type: "Documentation" },
      { id: "2", title: "Real Python", url: "https://realpython.com/", type: "Tutorial" },
    ],
  },
  sql: {
    name: "SQL",
    description: "Language for managing and querying databases, essential for backend and data roles.",
    demandLevel: "high",
    resources: [
      { id: "1", title: "SQL Tutorial", url: "https://www.w3schools.com/sql/", type: "Tutorial" },
    ],
  },
};

// Job title to required skills mapping
const jobSkillsMap = {
  // Technology & Software Development
  "frontend developer": ["html", "css", "javascript", "react"],
  "senior frontend developer": ["html", "css", "javascript", "typescript", "react", "redux", "jest"],
  "react developer": ["javascript", "react", "html", "css"],
  "senior react developer": ["javascript", "typescript", "react", "redux", "jest", "nextjs"],
  "full stack developer": ["javascript", "html", "css", "node", "express", "sql"],
  "senior full stack developer": ["javascript", "typescript", "react", "node", "express", "sql", "mongodb", "docker"],
  "data scientist": ["python", "sql", "machine learning", "pandas", "numpy"],
  "machine learning engineer": ["python", "tensorflow", "pytorch", "sql", "deep learning"],
  "cybersecurity analyst": ["network security", "linux", "python", "ethical hacking"],
  "cloud engineer": ["aws", "azure", "gcp", "terraform", "docker", "kubernetes"],
  "product manager": ["agile", "scrum", "market research", "wireframing"],
  "ui/ux designer": ["figma", "adobe xd", "user research", "prototyping"],
  
  // Marketing & Sales
  "marketing manager": ["seo", "google ads", "social media", "analytics"],
  "digital marketer": ["seo", "content marketing", "email marketing", "ppc"],
  "sales executive": ["crm", "negotiation", "cold calling", "lead generation"],
  
  // Finance & Business
  "financial analyst": ["excel", "sql", "financial modeling", "python"],
  "accountant": ["gaap", "excel", "tax preparation", "quickbooks"],
  "business analyst": ["sql", "data visualization", "stakeholder management"],
  
  // Construction & Engineering
  "construction manager": ["project management", "autocad", "osha regulations"],
  "civil engineer": ["autocad", "structural analysis", "construction management"],
  "mechanical engineer": ["cad", "solidworks", "thermodynamics", "manufacturing processes"],
  
  // Healthcare
  "registered nurse": ["patient care", "medical documentation", "emergency response"],
  "physician": ["diagnosis", "treatment planning", "medical ethics"],
  "pharmacist": ["medication dispensing", "pharmacology", "patient counseling"],
  
  // Education
  "teacher": ["lesson planning", "classroom management", "curriculum development"],
  "professor": ["academic research", "lecturing", "mentorship"],
  "school principal": ["leadership", "education policy", "staff management"],
  
  // Legal
  "lawyer": ["legal research", "court representation", "contract law"],
  "paralegal": ["legal documentation", "case management", "research"],
  
  // Logistics & Supply Chain
  "supply chain manager": ["inventory management", "logistics planning", "vendor relations"],
  "logistics coordinator": ["shipping management", "fleet coordination", "warehousing"],
  "truck driver": ["route planning", "vehicle maintenance", "safety regulations"],
  
  // Customer Support & Human Resources
  "customer service representative": ["crm", "communication", "problem-solving"],
  "hr manager": ["recruiting", "employee relations", "policy compliance"],
  "talent acquisition specialist": ["headhunting", "interviewing", "candidate evaluation"],
};


export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { targetJobTitle, userId, currentSkills } = await req.json()

    if (!targetJobTitle) {
      return NextResponse.json({ error: "Target job title is required" }, { status: 400 })
    }

    // Get user's current skills if not provided
    let userSkills = currentSkills
    if (!userSkills || !userSkills.length) {
      const jobSeeker = await prisma.jobSeeker.findUnique({
        where: { userId },
        select: { skills: true },
      })

      if (!jobSeeker) {
        return NextResponse.json({ error: "User profile not found" }, { status: 404 })
      }

      userSkills = jobSeeker.skills
    }

    // Normalize user skills to lowercase for comparison
    const normalizedUserSkills = userSkills.map((skill: string) => skill.toLowerCase())

    // Find the closest job title match
    const normalizedTargetJob = targetJobTitle.toLowerCase()
    let requiredSkills: string[] = []

    // Try to find an exact match first
    if (normalizedTargetJob in jobSkillsMap) {
      requiredSkills = jobSkillsMap[normalizedTargetJob as keyof typeof jobSkillsMap]
    } else {
      // If no exact match, find the closest match
      const jobTitles = Object.keys(jobSkillsMap)
      const closestMatch = jobTitles.find(
        (title) => normalizedTargetJob.includes(title) || title.includes(normalizedTargetJob),
      )

      if (closestMatch) {
        requiredSkills = jobSkillsMap[closestMatch as keyof typeof jobSkillsMap]
      } else {
        // If still no match, use a default set of skills
        requiredSkills = ["html", "css", "javascript", "react"]
      }
    }

    // Identify missing skills
    const missingSkillIds = requiredSkills.filter(
      (skill) => !normalizedUserSkills.some((userSkill: string | string[]) => userSkill.includes(skill) || skill.includes(userSkills)),
    )

    // Get detailed information for missing skills
    const missingSkills = missingSkillIds.map((skillId) => ({
      name: skillDatabase[skillId as keyof typeof skillDatabase]?.name || skillId,
      description: skillDatabase[skillId as keyof typeof skillDatabase]?.description || "No description available",
      demandLevel: skillDatabase[skillId as keyof typeof skillDatabase]?.demandLevel || "medium",
      learningResources: skillDatabase[skillId as keyof typeof skillDatabase]?.resources || [],
    }))

    // Calculate completeness percentage
    const completeness = Math.round((userSkills.length / (userSkills.length + missingSkills.length)) * 100)

    return NextResponse.json({
      currentSkills: userSkills,
      missingSkills,
      completeness,
    })
  } catch (error) {
    console.error("Error analyzing skill gap:", error)
    return NextResponse.json({ error: "Failed to analyze skill gap" }, { status: 500 })
  }
}


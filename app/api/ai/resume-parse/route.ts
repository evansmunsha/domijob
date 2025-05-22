import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // Parse request body
    const { fileUrl } = await req.json()

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 })
    }

    // Check if the file is a DOCX file
    if (!fileUrl.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ error: "Only DOCX files are supported" }, { status: 400 })
    }

    // Mock response - extract some text from the file URL
    // In a real implementation, you would fetch and parse the file
    const mockText = `
JOHN DOE
Software Engineer

CONTACT
Email: john.doe@example.com
Phone: (123) 456-7890
LinkedIn: linkedin.com/in/johndoe
GitHub: github.com/johndoe

SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development. Proficient in JavaScript, TypeScript, React, and Node.js. Passionate about creating efficient, scalable, and maintainable code.

EXPERIENCE
Senior Software Engineer
ABC Tech, Inc. | Jan 2020 - Present
- Led the development of a customer-facing web application that increased user engagement by 35%
- Implemented CI/CD pipelines that reduced deployment time by 50%
- Mentored junior developers and conducted code reviews

Software Engineer
XYZ Solutions | Mar 2017 - Dec 2019
- Developed RESTful APIs using Node.js and Express
- Built responsive front-end interfaces using React and Redux
- Collaborated with UX designers to implement user-friendly interfaces

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2013 - 2017

SKILLS
Programming: JavaScript, TypeScript, Python, Java
Frontend: React, Redux, HTML5, CSS3, SASS
Backend: Node.js, Express, MongoDB, PostgreSQL
Tools: Git, Docker, Jenkins, AWS
    `

    // Return the mock parsed text
    return NextResponse.json({
      text: mockText,
      creditsUsed: 5,
      remainingCredits: 45,
      isGuest: true,
    })
  } catch (error) {
    console.error("Resume parsing error:", error)
    return NextResponse.json({ error: "Failed to parse resume file" }, { status: 500 })
  }
}

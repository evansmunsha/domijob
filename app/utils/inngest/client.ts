import { Inngest } from "inngest"

// Define event types
type JobCreatedEvent = {
  name: "job/created"
  data: {
    jobId: string
    companyId: string
  }
}

type SkillGapAnalysisEvent = {
  name: "user/request.skill-gap-analysis"
  data: {
    userId: string
    targetJobTitle: string
  }
}

// Create a client with your API key
export const inngest = new Inngest({
  id: "mi-job",
  // Add this to ensure events are sent immediately in development
  eventKey: process.env.INNGEST_EVENT_KEY || "dev",
})

// Export event types for use in functions
export type Events = JobCreatedEvent | SkillGapAnalysisEvent


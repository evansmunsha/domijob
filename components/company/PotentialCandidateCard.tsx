"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Mail } from "lucide-react"
import { useRouter } from "next/navigation" // Changed from next/router to next/navigation
import { toast } from "sonner" // Changed from react-hot-toast to sonner for consistency

interface PotentialCandidate {
  id: string
  viewerName: string
  skills?: string[]
  matchScore?: number
  jobId?: string
  read: boolean
  createdAt: Date
}

interface PotentialCandidateProps {
  notification: PotentialCandidate
  onContactClick: (candidateData: PotentialCandidate) => void
}

export function PotentialCandidateCard({ notification, onContactClick }: PotentialCandidateProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [sending, setSending] = useState(false)
  const [contacted, setContacted] = useState(notification.read)

  const handleContactClick = async () => {
    try {
      setSending(true)

      // If already contacted, just call the parent handler
      if (contacted) {
        onContactClick(notification)
        return
      }

      const response = await fetch("/api/company/contact-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: notification.viewerName,
          message: `Hi ${notification.viewerName}, I noticed you viewed our company profile. Your skills match what we're looking for. Would you be interested in discussing potential opportunities?`,
          notificationId: notification.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to contact candidate")
      }

      const data = await response.json()

      // Mark notification as contacted locally
      setContacted(true)

      // Navigate to the chat thread if one was created
      if (data.threadId) {
        router.push(`/messages/${data.threadId}`)
      } else {
        onContactClick(notification)
      }
    } catch (error) {
      console.error("Error contacting candidate:", error)
      toast.error("Failed to contact candidate")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className={notification.read ? "opacity-80" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{notification.viewerName}</CardTitle>
          <Badge>{notification.matchScore}% Match</Badge>
        </div>
        <CardDescription>
          Viewed your profile on {new Date(notification.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Skill Match</span>
              <span className="text-sm font-medium">{notification.matchScore}%</span>
            </div>
            <Progress value={notification.matchScore} className="h-2" />
          </div>

          {expanded && notification.skills && notification.skills.length > 0 && (
            <div>
              <span className="text-sm font-medium">Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {notification.skills.map((skill, index) => (
                  <Badge key={index} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show Less" : "Show More"}
        </Button>
        <Button size="sm" onClick={handleContactClick} disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              {contacted ? "Message" : "Contact"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}


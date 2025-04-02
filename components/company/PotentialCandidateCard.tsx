"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Mail } from "lucide-react"

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
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={notification.read ? "opacity-80" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{notification.viewerName}</CardTitle>
          <Badge>{notification.matchScore}% Match</Badge>
        </div>
        <CardDescription>Viewed your profile on {new Date(notification.createdAt).toLocaleDateString()}</CardDescription>
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
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show Less" : "Show More"}
        </Button>
        <Button size="sm" onClick={() => onContactClick(notification)}>
          <Mail className="h-4 w-4 mr-2" />
          Contact
        </Button>
      </CardFooter>
    </Card>
  )
}

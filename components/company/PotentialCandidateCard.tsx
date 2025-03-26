"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Mail } from "lucide-react"
import Link from "next/link"

interface PotentialCandidateProps {
  notification: {
    id: string
    message: string
    metadata: string
    jobId?: string
    read: boolean
    createdAt: Date
  }
  onContactClick: (candidateData: any) => void
}

export function PotentialCandidateCard({ notification, onContactClick }: PotentialCandidateProps) {
  const [expanded, setExpanded] = useState(false)

  // Parse the metadata
  let metadata: {
    skills: string[]
    matchScore: number
    viewerName: string
  } = { skills: [], matchScore: 0, viewerName: "Anonymous" }

  try {
    metadata = JSON.parse(notification.metadata || "{}")
  } catch (e) {
    console.error("Error parsing notification metadata:", e)
  }

  return (
    <Card className={notification.read ? "opacity-80" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{metadata.viewerName}</CardTitle>
          <Badge>{metadata.matchScore}% Match</Badge>
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
              <span className="text-sm font-medium">{metadata.matchScore}%</span>
            </div>
            <Progress value={metadata.matchScore} className="h-2" />
          </div>

          {expanded && (
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1">
                {metadata.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="bg-muted">
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
        <div className="flex gap-2">
          {notification.jobId && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/job/${notification.jobId}`}>View Job</Link>
            </Button>
          )}
          <Button size="sm" onClick={() => onContactClick(metadata)}>
            <Mail className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}


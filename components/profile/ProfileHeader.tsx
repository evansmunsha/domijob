"use client"


import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, FileText } from "lucide-react"
import { useState } from "react"

interface ProfileHeaderProps {
  name: string
  email: string
  image?: string
  resumeUrl: string
}

export function ProfileHeader({ name, email, image, resumeUrl }: ProfileHeaderProps) {
  const [currentResume, setCurrentResume] = useState(resumeUrl)
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="text-2xl">{name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">{name}</h1>
            <div className="flex flex-col md:flex-row gap-2 mt-2 items-center md:items-start">
              <div className="flex items-center text-muted-foreground">
                <Mail className="mr-2 h-4 w-4" />
                {email}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              <Badge variant="secondary">Job Seeker</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={currentResume} target="_blank">
                <FileText className="h-4 w-4 mr-2" />
                View Resume
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


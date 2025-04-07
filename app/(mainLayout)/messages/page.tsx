"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface MessageThread {
  id: string
  participant: {
    id: string
    name: string
    image: string | null
    type: "COMPANY" | "JOB_SEEKER"
  }
  lastMessage: {
    content: string
    sentAt: string
    isFromUser: boolean
    read: boolean
  } | null
  updatedAt: string
}

export default function MessagesPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchThreads() {
      try {
        setLoading(true)
        const response = await fetch("/api/messages")

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login")
            return
          }
          throw new Error("Failed to fetch messages")
        }

        const data = await response.json()
        setThreads(data)
      } catch (error) {
        console.error("Error fetching message threads:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchThreads()
  }, [router])

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">You don&apos;t have any messages yet.</p>
            <p className="text-sm text-muted-foreground">
              When you connect with companies or job seekers, your conversations will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/messages/${thread.id}`}
                  className={`flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors ${
                    thread.lastMessage && !thread.lastMessage.read && !thread.lastMessage.isFromUser
                      ? "bg-primary/5"
                      : ""
                  }`}
                >
                  <Avatar>
                    <AvatarImage
                      src={thread.participant.image || `https://avatar.vercel.sh/${thread.participant.name}`}
                      alt={thread.participant.name}
                    />
                    <AvatarFallback>{thread.participant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">{thread.participant.name}</h3>
                      {thread.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(thread.lastMessage.sentAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {thread.lastMessage ? (
                      <p className="text-sm text-muted-foreground truncate">
                        {thread.lastMessage.isFromUser ? "You: " : ""}
                        {thread.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No messages yet</p>
                    )}
                  </div>
                  {thread.lastMessage && !thread.lastMessage.read && !thread.lastMessage.isFromUser && (
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


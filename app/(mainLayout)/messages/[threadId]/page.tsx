"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { use } from "react"

interface ThreadParticipant {
  id: string
  name: string
  image: string | null
  type: "COMPANY" | "JOB_SEEKER"
}

interface Message {
  id: string
  content: string
  sentAt: string
  isFromUser: boolean
  read: boolean
}

interface ThreadData {
  thread: {
    id: string
    participant: ThreadParticipant
  }
  messages: Message[]
}

export default function MessageThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const { threadId } = resolvedParams

  const router = useRouter()
  const [threadData, setThreadData] = useState<ThreadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchThreadData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/messages/${threadId}`)

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login")
            return
          }
          if (response.status === 404) {
            router.push("/messages")
            return
          }
          throw new Error("Failed to fetch thread data")
        }

        const data = await response.json()
        setThreadData(data)
      } catch (error) {
        console.error("Error fetching thread data:", error)
        toast.error("Failed to load conversation")
      } finally {
        setLoading(false)
      }
    }

    fetchThreadData()

    // Set up polling for new messages
    const intervalId = setInterval(fetchThreadData, 10000) // Poll every 10 seconds

    return () => clearInterval(intervalId)
  }, [threadId, router])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [threadData?.messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !threadData) return

    try {
      setSending(true)
      const response = await fetch(`/api/messages/${threadId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const sentMessage = await response.json()

      // Update the thread data with the new message
      setThreadData({
        ...threadData,
        messages: [...threadData.messages, sentMessage],
      })

      // Clear the input
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/messages" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to messages
          </Link>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!threadData) return null

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/messages" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to messages
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar>
            <AvatarImage
              src={
                threadData.thread.participant.image || `https://avatar.vercel.sh/${threadData.thread.participant.name}`
              }
              alt={threadData.thread.participant.name}
            />
            <AvatarFallback>{threadData.thread.participant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle>{threadData.thread.participant.name}</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
            {threadData.messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</p>
            ) : (
              threadData.messages.map((message) => (
                <div key={message.id} className={`flex ${message.isFromUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isFromUser ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                    <span className="text-xs opacity-70 block text-right mt-1">
                      {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


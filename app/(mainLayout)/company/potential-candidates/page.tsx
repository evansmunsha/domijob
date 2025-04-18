"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PotentialCandidateCard } from "@/components/company/PotentialCandidateCard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Define interface for candidate data
interface PotentialCandidate {
  id: string
  viewerName: string
  skills?: string[]
  matchScore?: number
  jobId?: string
  read: boolean
  createdAt: Date
}

// Add a new interface for the raw notification data from the API
interface RawNotification {
  id: string
  metadata: string | null
  jobId: string | null
  read: boolean
  createdAt: string
}

export default function PotentialCandidatesPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<PotentialCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<PotentialCandidate | null>(null)
  const [message, setMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true)
        const response = await fetch("/api/company/potential-candidates")

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login")
            return
          }
          throw new Error("Failed to fetch potential candidates")
        }

        const data = await response.json()
        const formattedData = data
          .map((notification: RawNotification) => {
            try {
              const metadata = JSON.parse(notification.metadata || "{}")
              return {
                id: notification.id,
                viewerName: metadata.viewerName || "Anonymous",
                skills: metadata.skills || [],
                matchScore: metadata.matchScore || 0,
                jobId: notification.jobId,
                read: notification.read,
                createdAt: new Date(notification.createdAt),
              }
            } catch (error) {
              console.error("Error parsing metadata:", error)
              return null
            }
          })
          .filter(Boolean) // Remove null values

        setNotifications(formattedData)
      } catch (error) {
        console.error("Error fetching potential candidates:", error)
        toast.error("Failed to load potential candidates")
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [router])

  const handleContactClick = (candidateData: PotentialCandidate) => {
    setSelectedCandidate(candidateData)
    setContactDialogOpen(true)

    // Pre-fill message based on skills
    if (candidateData.skills && candidateData.skills.length > 0) {
      const skillsList = candidateData.skills.slice(0, 3).join(", ")
      setMessage(
        `Hi ${candidateData.viewerName},\n\nI noticed you viewed our company profile. Your skills in ${skillsList} caught our attention. We'd love to discuss potential opportunities with you.\n\nLooking forward to connecting!`,
      )
    }
  }

  const handleSendMessage = async () => {
    if (!selectedCandidate) return

    try {
      setSendingMessage(true)

      const response = await fetch("/api/company/contact-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: selectedCandidate.viewerName,
          message,
          notificationId: selectedCandidate.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send message")
      }

      // Update the local state to mark this notification as read
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === selectedCandidate.id ? { ...notification, read: true } : notification,
        ),
      )

      toast.success(`Message sent to ${selectedCandidate.viewerName}!`)
      setContactDialogOpen(false)
      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Potential Candidates</h1>
        <div className="text-center py-12">Loading potential candidates...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Potential Candidates</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No potential candidates found yet.</p>
          <p className="mt-2">When job seekers with matching skills view your profile, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notifications.map((notification) => (
            <PotentialCandidateCard
              key={notification.id}
              notification={notification}
              onContactClick={handleContactClick}
            />
          ))}
        </div>
      )}

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact {selectedCandidate?.viewerName}</DialogTitle>
            <DialogDescription>Send a message to this potential candidate to express your interest.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                placeholder="Enter your message here..."
                disabled={sendingMessage}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)} disabled={sendingMessage}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={sendingMessage}>
              {sendingMessage ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


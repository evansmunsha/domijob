"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Heart, Share2, MessageSquare, Twitter, Linkedin, Facebook, LinkIcon, Check, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface BlogInteractionsProps {
  postId: string
  postTitle: string
  postUrl: string
  initialLikes: number
  initialComments: number
  views: number
  initialUserLiked?: boolean
}

export function BlogInteractions({
  postId,
  postTitle,
  postUrl,
  initialLikes,
  initialComments,
  views,
  initialUserLiked = false,
}: BlogInteractionsProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(initialUserLiked)
  const [isLiking, setIsLiking] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch current like status on mount
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/blog/posts/by-id/${postId}/like`)
        if (response.ok) {
          const data = await response.json()
          setLikes(data.likeCount)
          setIsLiked(data.userLiked)
        }
      } catch (error) {
        console.error("Error fetching like status:", error)
      }
    }

    fetchLikeStatus()
  }, [postId])

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)

    try {
      const response = await fetch(`/api/blog/posts/by-id/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLikes(data.likeCount)
        setIsLiked(data.liked)
        toast.success(data.liked ? "Post liked! ❤️" : "Like removed")
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to like post")
      }
    } catch (error) {
      console.error("Error liking post:", error)
      toast.error("Something went wrong")
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = (platform: string) => {
    const encodedTitle = encodeURIComponent(postTitle)
    const encodedUrl = encodeURIComponent(postUrl)

    let shareUrl = ""

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=DomiJob`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case "quora":
        shareUrl = `https://www.quora.com/search?q=${encodedUrl}`
        break
      case "copy":
        navigator.clipboard.writeText(postUrl)
        setCopied(true)
        toast.success("Link copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
        return
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
    }
  }

  const scrollToComments = () => {
    const commentsSection = document.getElementById("comments-section")
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        {/* Like Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLike}
          disabled={isLiking}
          className={`gap-2 transition-all duration-200 ${
            isLiked
              ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
              : "hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20"
          }`}
        >
          <Heart className={`h-4 w-4 transition-all duration-200 ${isLiked ? "fill-current" : ""}`} />
          <span className="font-medium">{likes}</span>
        </Button>

        {/* Comment Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={scrollToComments}
          className="gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-950/20"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium">{initialComments}</span>
        </Button>

        {/* Share Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-green-50 hover:border-green-200 hover:text-green-600 dark:hover:bg-green-950/20"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => handleShare("twitter")} className="gap-2">
              <Twitter className="h-4 w-4 text-blue-400" />
              Share on Twitter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare("linkedin")} className="gap-2">
              <Linkedin className="h-4 w-4 text-blue-600" />
              Share on LinkedIn
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare("facebook")} className="gap-2">
              <Facebook className="h-4 w-4 text-blue-500" />
              Share on Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare("quora")} className="gap-2">
              <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.1,12.3c-0.4-0.8-0.9-1.6-1.3-2.4c-0.6,0.9-1.2,1.7-1.7,2.6c1,0.7,2,1.3,3,1.9V12.3z M21.9,7.5 c-0.3-0.7-0.6-1.5-1-2.2C19.7,3.4,17.9,2,15.8,1.2c-1.8-0.7-3.7-1-5.6-1C8.3,0.2,6.4,0.5,4.6,1.2C2.5,2,0.7,3.4-0.5,5.3 c-0.4,0.7-0.8,1.4-1,2.2C-2,9.2-2.2,11-2,12.8c0.2,1.8,0.7,3.5,1.6,5.1c0.9,1.6,2.1,2.9,3.6,3.8c1.5,1,3.2,1.5,5,1.6 c1.8,0.1,3.6-0.2,5.2-0.9c0.9-0.4,1.7-0.9,2.4-1.5c0.7,0.6,1.5,1.1,2.4,1.5c1.7,0.7,3.4,1,5.2,0.9c1.8-0.1,3.5-0.7,5-1.6 c1.5-1,2.7-2.3,3.6-3.8c0.9-1.6,1.4-3.3,1.6-5.1C23.6,11,23.4,9.2,21.9,7.5z M11.9,17.3c-1.5-0.9-3-1.9-4.4-2.8 c0.8-1.2,1.6-2.5,2.4-3.7c-0.8-1.2-1.6-2.5-2.4-3.7c1.4-0.9,2.9-1.9,4.4-2.8V17.3z"/>
              </svg>
              Share on Quora
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare("copy")} className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Link Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Views Counter */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Eye className="h-4 w-4" />
        <span>{views.toLocaleString()} views</span>
      </div>
    </div>
  )
}
